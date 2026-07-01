import os
import sqlite3
from werkzeug.security import generate_password_hash

DB_FILE = 'food_delivery.db'

def init_db():
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        print(f"Removed existing database: {DB_FILE}")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Create tables
    print("Creating tables...")
    cursor.executescript("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('customer', 'owner', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        cuisine TEXT,
        address TEXT,
        image_url TEXT,
        owner_id INTEGER,
        FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image_url TEXT,
        category TEXT NOT NULL CHECK(category IN ('Starter', 'Main Course', 'Dessert', 'Beverage')),
        FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        restaurant_id INTEGER NOT NULL,
        total_price REAL NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')),
        delivery_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY(menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    );

    CREATE TABLE reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        restaurant_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        UNIQUE(customer_id, restaurant_id)
    );
    """)

    # Seed data
    print("Seeding database...")
    
    # 1. Users
    users_data = [
        ('admin', generate_password_hash('admin'), 'admin@feastexpress.com', 'admin'),
        ('owner1', generate_password_hash('owner'), 'pizza_palace@feastexpress.com', 'owner'),
        ('owner2', generate_password_hash('owner'), 'sushi_central@feastexpress.com', 'owner'),
        ('owner3', generate_password_hash('owner'), 'burger_bistro@feastexpress.com', 'owner'),
        ('customer', generate_password_hash('password'), 'john.doe@gmail.com', 'customer'),
        ('customer2', generate_password_hash('password'), 'jane.smith@gmail.com', 'customer')
    ]
    cursor.executemany("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)", users_data)

    # 2. Restaurants
    restaurants_data = [
        ('Pizza Palace', 'Authentic brick-oven Italian pizzas, fresh pasta, and delectable garlic knots.', 'Italian', '123 Main St, Downtown', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60', 2),
        ('Sushi Central', 'Freshly sliced sashimi, specialty sushi rolls, and traditional Japanese ramen.', 'Japanese', '456 Elm St, Midtown', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60', 3),
        ('Burger Bistro', 'Gourmet grass-fed beef burgers, crispy sweet potato fries, and thick craft milkshakes.', 'American', '789 Oak St, Westend', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60', 4)
    ]
    cursor.executemany("INSERT INTO restaurants (name, description, cuisine, address, image_url, owner_id) VALUES (?, ?, ?, ?, ?, ?)", restaurants_data)

    # 3. Menu Items
    # Restaurant 1: Pizza Palace (ID: 1)
    r1_items = [
        (1, 'Bruschetta', 'Toasted sourdough topped with diced tomatoes, fresh basil, garlic, and balsamic glaze.', 8.99, 'https://images.unsplash.com/photo-1572656631137-7935297eff55?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (1, 'Garlic Knots', 'Warm pizza dough knots tossed in olive oil, fresh minced garlic, parmesan, and parsley.', 6.49, 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (1, 'Margherita Pizza', 'San Marzano tomato sauce, fresh mozzarella, fresh basil, and extra virgin olive oil.', 14.99, 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (1, 'Pepperoni Feast Pizza', 'Double pepperoni, mozzarella cheese, and our signature herb-infused tomato sauce.', 16.99, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (1, 'Tiramisu', 'Layers of espresso-soaked ladyfingers and creamy mascarpone, dusted with cocoa powder.', 7.99, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=60', 'Dessert'),
        (1, 'Italian Soda', 'Refreshing sparkling water flavored with natural raspberry syrup.', 3.49, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60', 'Beverage')
    ]
    
    # Restaurant 2: Sushi Central (ID: 2)
    r2_items = [
        (2, 'Edamame', 'Steamed soybeans sprinkled with coarse sea salt.', 4.99, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (2, 'Gyoza', 'Pan-fried Japanese pork dumplings served with a savory dipping sauce.', 7.99, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (2, 'Signature Dragon Roll', 'Eel and cucumber inside, topped with avocado, tobiko, and sweet eel sauce.', 15.99, 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (2, 'Tonkotsu Ramen', 'Rich pork bone broth, fresh ramen noodles, chashu pork, soft-boiled egg, and green onion.', 14.49, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (2, 'Matcha Ice Cream', 'Creamy green tea ice cream topped with red bean paste.', 5.99, 'https://images.unsplash.com/photo-1505394033343-40a690728749?w=500&auto=format&fit=crop&q=60', 'Dessert'),
        (2, 'Iced Oolong Tea', 'Traditional chilled Japanese green tea.', 2.99, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60', 'Beverage')
    ]

    # Restaurant 3: Burger Bistro (ID: 3)
    r3_items = [
        (3, 'Onion Rings', 'Crispy beer-battered onion rings served with spicy chipotle aioli.', 5.99, 'https://images.unsplash.com/photo-1639024471283-2bc7b3c6a267?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (3, 'Bacon Cheeseburger', 'Angus beef patty, cheddar, crispy smoked bacon, lettuce, tomato, and bistro sauce.', 13.99, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (3, 'Truffle Mushroom Burger', 'Gourmet beef patty topped with sautéed wild mushrooms, swiss cheese, and black truffle oil.', 14.99, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (3, 'Warm Fudge Brownie', 'Rich chocolate brownie served warm with a scoop of vanilla bean ice cream.', 6.99, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60', 'Dessert'),
        (3, 'Chocolate Milkshake', 'Creamy vanilla ice cream blended with dark Belgian chocolate syrup and whipped cream.', 4.99, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=60', 'Beverage')
    ]

    cursor.executemany("INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES (?, ?, ?, ?, ?, ?)", r1_items + r2_items + r3_items)

    # 4. Reviews
    reviews_data = [
        (5, 1, 5, 'Absolutely incredible! The Margherita pizza is as authentic as it gets. Will order again!'),
        (6, 1, 4, 'Very good pizza and quick delivery. The garlic knots were slightly oily but delicious.'),
        (5, 2, 5, 'The sashimi was incredibly fresh and the Tonkotsu broth was so rich! Highly recommend.'),
        (6, 2, 4, 'Excellent sushi rolls. A bit on the pricey side but definitely worth the quality.'),
        (5, 3, 4, 'Solid burger. Bacon was extremely crispy! Frites were a bit cold.'),
        (6, 3, 5, 'The truffle mushroom burger is to die for. Hands down the best burger in town!')
    ]
    cursor.executemany("INSERT INTO reviews (customer_id, restaurant_id, rating, comment) VALUES (?, ?, ?, ?)", reviews_data)

    # 5. Orders (Pre-existing orders for display)
    # Order 1: Pending for Restaurant 1 (Pizza Palace) from customer (user_id 5)
    cursor.execute("""
    INSERT INTO orders (customer_id, restaurant_id, total_price, status, delivery_address) 
    VALUES (5, 1, 23.48, 'Pending', '102 Pine Road, Apt 4B')
    """)
    order_id_1 = cursor.lastrowid
    cursor.executemany("INSERT INTO order_items (order_id, menu_item_id, price, quantity) VALUES (?, ?, ?, ?)", [
        (order_id_1, 3, 14.99, 1), # Margherita Pizza
        (order_id_1, 5, 7.99, 1)    # Tiramisu
    ])

    # Order 2: Delivered for Restaurant 2 (Sushi Central) from customer2 (user_id 6)
    cursor.execute("""
    INSERT INTO orders (customer_id, restaurant_id, total_price, status, delivery_address) 
    VALUES (6, 2, 38.47, 'Delivered', '742 Evergreen Terrace')
    """)
    order_id_2 = cursor.lastrowid
    cursor.executemany("INSERT INTO order_items (order_id, menu_item_id, price, quantity) VALUES (?, ?, ?, ?)", [
        (order_id_2, 9, 15.99, 1), # Dragon Roll
        (order_id_2, 10, 14.49, 1), # Ramen
        (order_id_2, 12, 2.99, 2)   # Oolong Tea * 2
    ])

    conn.commit()
    conn.close()
    print("Database successfully initialized!")

if __name__ == '__main__':
    init_db()
