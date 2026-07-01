import os
import sqlite3
import secrets
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

DB_FILE = 'food_delivery.db'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# Helper: Get current user based on Bearer Token
def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    
    conn = get_db_connection()
    # Query to check if token is valid and not expired
    user = conn.execute('''
        SELECT u.id, u.username, u.email, u.role 
        FROM users u 
        JOIN sessions s ON u.id = s.user_id 
        WHERE s.token = ? AND s.expires_at > datetime('now')
    ''', (token,)).fetchone()
    conn.close()
    
    if user:
        return dict(user)
    return None

# ==========================================
# AUTH ENDPOINTS
# ==========================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    role = data.get('role', 'customer')

    if not username or not password or not email:
        return jsonify({"error": "Username, password and email are required"}), 400
    
    if role not in ['customer', 'owner', 'admin']:
        return jsonify({"error": "Invalid role"}), 400

    hashed_password = generate_password_hash(password)

    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
            (username, hashed_password, email, role)
        )
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({"error": "Username or Email already exists"}), 400
    
    conn.close()
    return jsonify({"message": "Registration successful"}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, username)).fetchone()

    if not user or not check_password_hash(user['password'], password):
        conn.close()
        return jsonify({"error": "Invalid credentials"}), 401

    # Generate token
    token = secrets.token_hex(32)
    # Expires in 7 days (UTC format)
    expires_at = (datetime.utcnow() + timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')

    conn.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
        (token, user['id'], expires_at)
    )
    conn.commit()
    conn.close()

    return jsonify({
        "token": token,
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "role": user['role']
        }
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        conn = get_db_connection()
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/auth/me', methods=['GET'])
def me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized or session expired"}), 401
    return jsonify({"user": user})

# ==========================================
# RESTAURANT ENDPOINTS
# ==========================================

@app.route('/api/restaurants', methods=['GET'])
def get_restaurants():
    cuisine = request.args.get('cuisine')
    search = request.args.get('search')
    
    conn = get_db_connection()
    
    query = """
        SELECT r.id, r.name, r.description, r.cuisine, r.address, r.image_url, r.owner_id,
               COALESCE(AVG(rv.rating), 0.0) as rating, COUNT(rv.id) as review_count
        FROM restaurants r
        LEFT JOIN reviews rv ON r.id = rv.restaurant_id
    """
    params = []
    where_clauses = []
    
    if cuisine:
        where_clauses.append("r.cuisine = ?")
        params.append(cuisine)
    
    if search:
        where_clauses.append("(r.name LIKE ? OR r.description LIKE ?)")
        params.append(f"%{search}%")
        params.append(f"%{search}%")
        
    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)
        
    query += " GROUP BY r.id"
    
    restaurants = conn.execute(query, params).fetchall()
    
    # Get distinct cuisines for frontend filtering
    cuisines_rows = conn.execute("SELECT DISTINCT cuisine FROM restaurants WHERE cuisine IS NOT NULL").fetchall()
    cuisines = [row['cuisine'] for row in cuisines_rows]
    
    conn.close()
    
    result = []
    for r in restaurants:
        item = dict(r)
        # Format rating to 1 decimal place
        item['rating'] = round(item['rating'], 1)
        result.append(item)
        
    return jsonify({
        "restaurants": result,
        "cuisines": cuisines
    })

@app.route('/api/restaurants/<int:restaurant_id>', methods=['GET'])
def get_restaurant_details(restaurant_id):
    conn = get_db_connection()
    
    restaurant = conn.execute("""
        SELECT r.id, r.name, r.description, r.cuisine, r.address, r.image_url, r.owner_id,
               COALESCE(AVG(rv.rating), 0.0) as rating, COUNT(rv.id) as review_count
        FROM restaurants r
        LEFT JOIN reviews rv ON r.id = rv.restaurant_id
        WHERE r.id = ?
        GROUP BY r.id
    """, (restaurant_id,)).fetchone()
    
    if not restaurant:
        conn.close()
        return jsonify({"error": "Restaurant not found"}), 404
        
    menu_items = conn.execute("SELECT * FROM menu_items WHERE restaurant_id = ?", (restaurant_id,)).fetchall()
    
    reviews = conn.execute("""
        SELECT rv.id, rv.rating, rv.comment, rv.created_at, u.username
        FROM reviews rv
        JOIN users u ON rv.customer_id = u.id
        WHERE rv.restaurant_id = ?
        ORDER BY rv.created_at DESC
    """, (restaurant_id,)).fetchall()
    
    conn.close()
    
    rest_dict = dict(restaurant)
    rest_dict['rating'] = round(rest_dict['rating'], 1)
    
    return jsonify({
        "restaurant": rest_dict,
        "menu": [dict(m) for m in menu_items],
        "reviews": [dict(rv) for rv in reviews]
    })

@app.route('/api/restaurants', methods=['POST'])
def create_restaurant():
    user = get_current_user()
    if not user or user['role'] not in ['admin', 'owner']:
        return jsonify({"error": "Unauthorized"}), 403
        
    data = request.json or {}
    name = data.get('name')
    description = data.get('description')
    cuisine = data.get('cuisine')
    address = data.get('address')
    image_url = data.get('image_url')
    # Default to current user if they are owner, otherwise use specified owner_id or NULL for admin
    owner_id = user['id'] if user['role'] == 'owner' else data.get('owner_id')

    if not name or not cuisine or not address:
        return jsonify({"error": "Name, Cuisine and Address are required"}), 400
        
    conn = get_db_connection()
    cursor = conn.execute(
        "INSERT INTO restaurants (name, description, cuisine, address, image_url, owner_id) VALUES (?, ?, ?, ?, ?, ?)",
        (name, description, cuisine, address, image_url, owner_id)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    
    return jsonify({"message": "Restaurant created successfully", "id": new_id}), 201

@app.route('/api/restaurants/<int:restaurant_id>', methods=['PUT'])
def update_restaurant(restaurant_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db_connection()
    restaurant = conn.execute("SELECT * FROM restaurants WHERE id = ?", (restaurant_id,)).fetchone()
    if not restaurant:
        conn.close()
        return jsonify({"error": "Restaurant not found"}), 404
        
    # Check permissions (Admin or the Restaurant Owner)
    if user['role'] != 'admin' and restaurant['owner_id'] != user['id']:
        conn.close()
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.json or {}
    name = data.get('name', restaurant['name'])
    description = data.get('description', restaurant['description'])
    cuisine = data.get('cuisine', restaurant['cuisine'])
    address = data.get('address', restaurant['address'])
    image_url = data.get('image_url', restaurant['image_url'])
    
    conn.execute("""
        UPDATE restaurants 
        SET name = ?, description = ?, cuisine = ?, address = ?, image_url = ?
        WHERE id = ?
    """, (name, description, cuisine, address, image_url, restaurant_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Restaurant updated successfully"})

@app.route('/api/restaurants/<int:restaurant_id>', methods=['DELETE'])
def delete_restaurant(restaurant_id):
    user = get_current_user()
    if not user or user['role'] != 'admin':
        return jsonify({"error": "Forbidden"}), 403
        
    conn = get_db_connection()
    conn.execute("DELETE FROM restaurants WHERE id = ?", (restaurant_id,))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Restaurant deleted successfully"})

# ==========================================
# MENU ITEMS ENDPOINTS
# ==========================================

@app.route('/api/restaurants/<int:restaurant_id>/menu', methods=['POST'])
def add_menu_item(restaurant_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db_connection()
    restaurant = conn.execute("SELECT * FROM restaurants WHERE id = ?", (restaurant_id,)).fetchone()
    if not restaurant:
        conn.close()
        return jsonify({"error": "Restaurant not found"}), 404
        
    # Only Admin or Restaurant Owner can add menu items
    if user['role'] != 'admin' and restaurant['owner_id'] != user['id']:
        conn.close()
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.json or {}
    name = data.get('name')
    description = data.get('description')
    price = data.get('price')
    image_url = data.get('image_url')
    category = data.get('category')
    
    if not name or price is None or not category:
        conn.close()
        return jsonify({"error": "Name, Price and Category are required"}), 400
        
    if category not in ['Starter', 'Main Course', 'Dessert', 'Beverage']:
        conn.close()
        return jsonify({"error": "Invalid Category"}), 400
        
    cursor = conn.execute("""
        INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (restaurant_id, name, description, float(price), image_url, category))
    
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    
    return jsonify({"message": "Menu item added successfully", "id": new_id}), 201

@app.route('/api/menu/<int:item_id>', methods=['PUT'])
def update_menu_item(item_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db_connection()
    menu_item = conn.execute("SELECT * FROM menu_items WHERE id = ?", (item_id,)).fetchone()
    if not menu_item:
        conn.close()
        return jsonify({"error": "Menu item not found"}), 404
        
    restaurant = conn.execute("SELECT * FROM restaurants WHERE id = ?", (menu_item['restaurant_id'],)).fetchone()
    
    if user['role'] != 'admin' and restaurant['owner_id'] != user['id']:
        conn.close()
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.json or {}
    name = data.get('name', menu_item['name'])
    description = data.get('description', menu_item['description'])
    price = data.get('price', menu_item['price'])
    image_url = data.get('image_url', menu_item['image_url'])
    category = data.get('category', menu_item['category'])
    
    if category not in ['Starter', 'Main Course', 'Dessert', 'Beverage']:
        conn.close()
        return jsonify({"error": "Invalid Category"}), 400
        
    conn.execute("""
        UPDATE menu_items 
        SET name = ?, description = ?, price = ?, image_url = ?, category = ?
        WHERE id = ?
    """, (name, description, float(price), image_url, category, item_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Menu item updated successfully"})

@app.route('/api/menu/<int:item_id>', methods=['DELETE'])
def delete_menu_item(item_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db_connection()
    menu_item = conn.execute("SELECT * FROM menu_items WHERE id = ?", (item_id,)).fetchone()
    if not menu_item:
        conn.close()
        return jsonify({"error": "Menu item not found"}), 404
        
    restaurant = conn.execute("SELECT * FROM restaurants WHERE id = ?", (menu_item['restaurant_id'],)).fetchone()
    
    if user['role'] != 'admin' and restaurant['owner_id'] != user['id']:
        conn.close()
        return jsonify({"error": "Forbidden"}), 403
        
    conn.execute("DELETE FROM menu_items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Menu item deleted successfully"})

# ==========================================
# ORDER ENDPOINTS
# ==========================================

@app.route('/api/orders', methods=['POST'])
def place_order():
    user = get_current_user()
    if not user or user['role'] != 'customer':
        return jsonify({"error": "Unauthorized or not a customer"}), 401
        
    data = request.json or {}
    restaurant_id = data.get('restaurant_id')
    delivery_address = data.get('delivery_address')
    items = data.get('items') # list of {menu_item_id, quantity}
    
    if not restaurant_id or not delivery_address or not items:
        return jsonify({"error": "Restaurant, Address and Items are required"}), 400
        
    conn = get_db_connection()
    
    # Calculate prices from database directly to avoid client manipulation
    total_price = 0.0
    order_items_data = []
    
    for item in items:
        item_id = item.get('menu_item_id')
        quantity = item.get('quantity', 1)
        
        db_item = conn.execute("SELECT * FROM menu_items WHERE id = ? AND restaurant_id = ?", (item_id, restaurant_id)).fetchone()
        if not db_item:
            conn.close()
            return jsonify({"error": f"Item ID {item_id} not found in this restaurant"}), 400
            
        price = db_item['price']
        total_price += price * quantity
        order_items_data.append((item_id, quantity, price))
        
    # Place order
    cursor = conn.execute("""
        INSERT INTO orders (customer_id, restaurant_id, total_price, status, delivery_address)
        VALUES (?, ?, ?, 'Pending', ?)
    """, (user['id'], restaurant_id, total_price, delivery_address))
    
    order_id = cursor.lastrowid
    
    # Insert order items
    for item_id, qty, prc in order_items_data:
        conn.execute("""
            INSERT INTO order_items (order_id, menu_item_id, quantity, price)
            VALUES (?, ?, ?, ?)
        """, (order_id, item_id, qty, prc))
        
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Order placed successfully", "order_id": order_id}), 201

@app.route('/api/orders', methods=['GET'])
def get_orders():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db_connection()
    
    if user['role'] == 'customer':
        orders = conn.execute("""
            SELECT o.id, o.restaurant_id, o.total_price, o.status, o.delivery_address, o.created_at,
                   r.name as restaurant_name, r.image_url as restaurant_image
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.id
            WHERE o.customer_id = ?
            ORDER BY o.created_at DESC
        """, (user['id'],)).fetchall()
        
    elif user['role'] == 'owner':
        # Show orders for all restaurants owned by this owner
        orders = conn.execute("""
            SELECT o.id, o.restaurant_id, o.total_price, o.status, o.delivery_address, o.created_at,
                   r.name as restaurant_name, u.username as customer_name
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.id
            JOIN users u ON o.customer_id = u.id
            WHERE r.owner_id = ?
            ORDER BY o.created_at DESC
        """, (user['id'],)).fetchall()
        
    else: # Admin: see all orders
        orders = conn.execute("""
            SELECT o.id, o.restaurant_id, o.total_price, o.status, o.delivery_address, o.created_at,
                   r.name as restaurant_name, u.username as customer_name
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.id
            JOIN users u ON o.customer_id = u.id
            ORDER BY o.created_at DESC
        """, []).fetchall()
        
    conn.close()
    return jsonify({"orders": [dict(o) for o in orders]})

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order_details(order_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db_connection()
    order = conn.execute("""
        SELECT o.id, o.customer_id, o.restaurant_id, o.total_price, o.status, o.delivery_address, o.created_at,
               r.name as restaurant_name, r.address as restaurant_address, r.owner_id as restaurant_owner_id,
               u.username as customer_name
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        JOIN users u ON o.customer_id = u.id
        WHERE o.id = ?
    """, (order_id,)).fetchone()
    
    if not order:
        conn.close()
        return jsonify({"error": "Order not found"}), 404
        
    # Check permissions
    if (user['role'] == 'customer' and order['customer_id'] != user['id']) or \
       (user['role'] == 'owner' and order['restaurant_owner_id'] != user['id']) and \
       user['role'] != 'admin':
        conn.close()
        return jsonify({"error": "Forbidden"}), 403
        
    items = conn.execute("""
        SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price, mi.name as name
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
    """, (order_id,)).fetchall()
    
    conn.close()
    
    return jsonify({
        "order": dict(order),
        "items": [dict(i) for i in items]
    })

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json or {}
    new_status = data.get('status')
    
    if not new_status or new_status not in ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']:
        return jsonify({"error": "Invalid status"}), 400
        
    conn = get_db_connection()
    order = conn.execute("""
        SELECT o.id, o.restaurant_id, r.owner_id as restaurant_owner_id
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        WHERE o.id = ?
    """, (order_id,)).fetchone()
    
    if not order:
        conn.close()
        return jsonify({"error": "Order not found"}), 404
        
    # Check permissions (Admin or Restaurant Owner)
    if user['role'] != 'admin' and order['restaurant_owner_id'] != user['id']:
        conn.close()
        return jsonify({"error": "Forbidden"}), 403
        
    conn.execute("UPDATE orders SET status = ? WHERE id = ?", (new_status, order_id))
    conn.commit()
    conn.close()
    
    return jsonify({"message": f"Order status updated to {new_status}"})

# ==========================================
# REVIEW ENDPOINTS
# ==========================================

@app.route('/api/restaurants/<int:restaurant_id>/reviews', methods=['POST'])
def add_review(restaurant_id):
    user = get_current_user()
    if not user or user['role'] != 'customer':
        return jsonify({"error": "Unauthorized. Only customers can leave reviews."}), 401
        
    data = request.json or {}
    rating = data.get('rating')
    comment = data.get('comment', '')
    
    if rating is None or not (1 <= int(rating) <= 5):
        return jsonify({"error": "Rating must be an integer between 1 and 5"}), 400
        
    conn = get_db_connection()
    
    # Optional: Verify customer ordered from this restaurant
    has_ordered = conn.execute("""
        SELECT COUNT(*) as count FROM orders 
        WHERE customer_id = ? AND restaurant_id = ? AND status = 'Delivered'
    """, (user['id'], restaurant_id)).fetchone()['count']
    
    if has_ordered == 0:
        # For demonstration purposes, we will allow reviews even without order, but log a warning.
        # However, let's keep it open or throw an error. Let's just allow it for easy testing, but comment the check.
        pass
        
    try:
        # SQLite UPSERT (ON CONFLICT)
        conn.execute("""
            INSERT INTO reviews (customer_id, restaurant_id, rating, comment)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(customer_id, restaurant_id) 
            DO UPDATE SET rating=excluded.rating, comment=excluded.comment, created_at=CURRENT_TIMESTAMP
        """, (user['id'], restaurant_id, int(rating), comment))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 400
        
    conn.close()
    return jsonify({"message": "Review submitted successfully"})

# ==========================================
# ADMIN ANALYTICS ENDPOINTS
# ==========================================

@app.route('/api/admin/metrics', methods=['GET'])
def get_admin_metrics():
    user = get_current_user()
    if not user or user['role'] != 'admin':
        return jsonify({"error": "Forbidden"}), 403
        
    conn = get_db_connection()
    
    # 1. Total statistics
    total_sales = conn.execute("SELECT SUM(total_price) FROM orders WHERE status = 'Delivered'").fetchone()[0] or 0.0
    total_orders = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0] or 0
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] or 0
    total_restaurants = conn.execute("SELECT COUNT(*) FROM restaurants").fetchone()[0] or 0
    
    # 2. Sales by Cuisine
    sales_by_cuisine_rows = conn.execute("""
        SELECT r.cuisine, COALESCE(SUM(o.total_price), 0.0) as revenue
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        WHERE o.status = 'Delivered'
        GROUP BY r.cuisine
        ORDER BY revenue DESC
    """).fetchall()
    sales_by_cuisine = [dict(r) for r in sales_by_cuisine_rows]
    
    # 3. Top Rated Restaurants
    top_restaurants_rows = conn.execute("""
        SELECT r.name, r.cuisine, COALESCE(AVG(rv.rating), 0.0) as rating, COUNT(rv.id) as review_count
        FROM restaurants r
        LEFT JOIN reviews rv ON r.id = rv.restaurant_id
        GROUP BY r.id
        ORDER BY rating DESC, review_count DESC
        LIMIT 5
    """).fetchall()
    top_restaurants = []
    for r in top_restaurants_rows:
        item = dict(r)
        item['rating'] = round(item['rating'], 1)
        top_restaurants.append(item)
        
    # 4. Recent orders list
    recent_orders_rows = conn.execute("""
        SELECT o.id, o.total_price, o.status, o.created_at,
               r.name as restaurant_name, u.username as customer_name
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        JOIN users u ON o.customer_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 10
    """).fetchall()
    recent_orders = [dict(o) for o in recent_orders_rows]
    
    # 5. List of owners for restaurant assigning
    owners_rows = conn.execute("SELECT id, username, email FROM users WHERE role = 'owner'").fetchall()
    owners = [dict(o) for o in owners_rows]
    
    conn.close()
    
    return jsonify({
        "metrics": {
            "total_sales": round(total_sales, 2),
            "total_orders": total_orders,
            "total_users": total_users,
            "total_restaurants": total_restaurants
        },
        "sales_by_cuisine": sales_by_cuisine,
        "top_restaurants": top_restaurants,
        "recent_orders": recent_orders,
        "owners": owners
    })

# ==========================================
# RUN APP
# ==========================================

if __name__ == '__main__':
    # Auto-init db if db file not present
    if not os.path.exists(DB_FILE):
        import db_init
        db_init.init_db()
        
    app.run(debug=True, port=5000)
