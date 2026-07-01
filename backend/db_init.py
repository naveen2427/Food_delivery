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
    print("Seeding database with Indian elements...")
    
    # 1. Users
    users_data = [
        ('admin', generate_password_hash('admin'), 'admin@feastexpress.in', 'admin'),
        ('owner1', generate_password_hash('owner'), 'spicesymphony@feastexpress.in', 'owner'),
        ('owner2', generate_password_hash('owner'), 'dakshindelights@feastexpress.in', 'owner'),
        ('owner3', generate_password_hash('owner'), 'mumbaichaat@feastexpress.in', 'owner'),
        ('customer', generate_password_hash('password'), 'amit.sharma@gmail.com', 'customer'),
        ('customer2', generate_password_hash('password'), 'priya.patel@gmail.com', 'customer')
    ]
    cursor.executemany("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)", users_data)

    # 2. Restaurants
    restaurants_data = [
        ('Spice Symphony', 'Rich and aromatic North Indian curries, tandoori items, and slow-cooked dumpukht biryanis.', 'North Indian', 'Shop 12, Sector 18 Market, Noida, Delhi NCR', 'https://images.unsplash.com/photo-1585938338392-50a59970d8ee?w=500&auto=format&fit=crop&q=60', 2),
        ('Dakshin Delights', 'Crispy masala dosas, fluffy idlis, flavorful sambar, and authentic traditional filter coffee.', 'South Indian', '100 Feet Road, Indiranagar, Bengaluru, Karnataka', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60', 3),
        ('Mumbai Street Bites', 'Spicy vada pavs, crispy samosa chaats, pav bhaji, and cutting masala chai.', 'Street Food', 'Linking Road, Bandra West, Mumbai, Maharashtra', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60', 4)
    ]
    cursor.executemany("INSERT INTO restaurants (name, description, cuisine, address, image_url, owner_id) VALUES (?, ?, ?, ?, ?, ?)", restaurants_data)

    # 3. Menu Items
    # Restaurant 1: Spice Symphony (ID: 1)
    r1_items = [
        (1, 'Paneer Tikka', 'Cottage cheese cubes marinated in spiced yogurt and grilled in a clay oven (tandoor).', 249.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (1, 'Chicken Seekh Kebab', 'Minced chicken skewers spiced with fresh coriander, cumin, and mint, roasted on skewers.', 299.00, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (1, 'Chicken Malai Tikka', 'Tender chicken chunks marinated in a creamy rich cashew paste, cheese, and cream, grilled to perfection.', 329.00, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (1, 'Tandoori Gobi', 'Cauliflower florets marinated in spiced yogurt and roasted in a tandoor.', 219.00, 'https://images.unsplash.com/photo-1585938338392-50a59970d8ee?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (1, 'Butter Chicken', 'Tender tandoori chicken cooked in a rich, velvety tomato and cream gravy with loads of butter.', 349.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (1, 'Shahi Paneer', 'Paneer cubes simmered in a smooth, aromatic cashew nut and cream gravy, spiced with cardamom.', 319.00, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (1, 'Dal Makhani', 'Black lentils and kidney beans slow-cooked overnight with spices, butter, and fresh cream.', 279.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (1, 'Chicken Dum Biryani', 'Long-grain basmati rice layered with spiced marinated chicken, saffron, and fresh mint, cooked on low flame (dum).', 349.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (1, 'Garlic Naan', 'Leavened flatbread brushed with fresh minced garlic and butter.', 69.00, 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (1, 'Gulab Jamun', 'Warm, deep-fried milk dumplings soaked in green cardamom-flavored sugar syrup (2 pieces).', 99.00, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60', 'Dessert'),
        (1, 'Rasmalai', 'Soft paneer patties soaked in sweet, saffron-infused milk, garnished with pistachios.', 119.00, 'https://images.unsplash.com/photo-1589301988718-d7a44f3c054f?w=500&auto=format&fit=crop&q=60', 'Dessert'),
        (1, 'Mango Lassi', 'Chilled sweet yogurt drink blended with fresh sweet Alphonso mango pulp.', 79.00, 'https://images.unsplash.com/photo-1571006682887-573562305593?w=500&auto=format&fit=crop&q=60', 'Beverage'),
        (1, 'Sweet Lassi', 'Traditional sweet and creamy Punjabi style churned yogurt drink topped with malai.', 69.00, 'https://images.unsplash.com/photo-1571006682887-573562305593?w=500&auto=format&fit=crop&q=60', 'Beverage')
    ]
    
    # Restaurant 2: Dakshin Delights (ID: 2)
    r2_items = [
        (2, 'Medu Vada', 'Crispy, savory deep-fried black lentil donuts, served with coconut chutney and hot sambar (2 pieces).', 89.00, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (2, 'Onion Uttapam', 'Thick savory rice and lentil pancakes topped with finely chopped onions, green chilies, and coriander.', 119.00, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (2, 'Idli Sambar', 'Steamed fluffy rice-lentil cakes served with freshly ground coconut chutney and mixed vegetable sambar (2 pieces).', 79.00, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (2, 'Special Masala Dosa', 'Thin, crispy rice crepes stuffed with spiced potato mash, served with fresh chutneys.', 149.00, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (2, 'Paneer Ghee Roast Dosa', 'Crispy dosa smeared with rich spicy Mangalorean ghee roast gravy and crumbled paneer.', 189.00, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (2, 'Mysore Masala Dosa', 'Crispy golden dosa lined with hot and spicy garlic-red chili chutney, stuffed with potato masala.', 169.00, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (2, 'Malabar Parotta with Kurma', 'Two flaky, layered flatbreads served with a spiced, mixed vegetable coconut milk gravy.', 179.00, 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (2, 'Kesari Bath', 'Sweet semolina pudding cooked with pure desi ghee, saffron, and loaded with cashew nuts.', 79.00, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60', 'Dessert'),
        (2, 'Elaneer Payasam', 'Traditional sweet dessert made of tender coconut pulp, milk, and condensed milk flavored with cardamom.', 99.00, 'https://images.unsplash.com/photo-1589301988718-d7a44f3c054f?w=500&auto=format&fit=crop&q=60', 'Dessert'),
        (2, 'Madras Filter Coffee', 'Authentic chicory-blend south Indian coffee frothed with hot milk in traditional brass tumbler.', 49.00, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60', 'Beverage'),
        (2, 'Spiced Buttermilk', 'Refreshing, watered churned yogurt flavored with ginger, green chilies, curry leaves, and coriander.', 49.00, 'https://images.unsplash.com/photo-1571006682887-573562305593?w=500&auto=format&fit=crop&q=60', 'Beverage')
    ]

    # Restaurant 3: Mumbai Street Bites (ID: 3)
    r3_items = [
        (3, 'Classic Vada Pav', 'The ultimate Mumbai street food - spicy potato fritter inside a soft bun with dry garlic chutney.', 49.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (3, 'Samosa Chaat', 'Crispy samosa crushed and topped with warm white peas gravy, sweet yogurt, and tangy chutneys.', 89.00, 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (3, 'Pani Puri (Gol Gappa)', 'Six crispy puffed puris stuffed with boiled potatoes and chickpeas, filled with sweet and spicy herbal water.', 59.00, 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (3, 'Sev Puri', 'Flat crisp puris topped with boiled potatoes, onions, a trio of sweet-sour-spicy chutneys, and fine sev.', 69.00, 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60', 'Starter'),
        (3, 'Pav Bhaji', 'Richly spiced mashed vegetable curry cooked on a flat tawa, served with two heavily buttered pav sliders.', 159.00, 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (3, 'Chole Bhature', 'Spicy Punjabi chickpea curry served with two puffed deep-fried leavened bread, pickles, and onions.', 179.00, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (3, 'Spicy Misal Pav', 'A spicy sprouted bean curry topped with farsan (crunchy mixture), onions, lemon, served with buttered pav.', 129.00, 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (3, 'Cheese Masala Toast', 'Bombay street style sandwich stuffed with spiced potatoes, cucumbers, onions, and processed cheese, toasted.', 119.00, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=60', 'Main Course'),
        (3, 'Kulfi Falooda', 'Creamy pistachio kulfi slices served with rose syrup, vermicelli, and basil seeds.', 119.00, 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=60', 'Dessert'),
        (3, 'Rabdi Jalebi', 'Crispy hot sugar-dipped jalebis served with a dollop of thick, reduced cardamom milk (rabdi).', 129.00, 'https://images.unsplash.com/photo-1589301988718-d7a44f3c054f?w=500&auto=format&fit=crop&q=60', 'Dessert'),
        (3, 'Cutting Masala Chai', 'Strong milk-boiled black tea infused with fresh crushed ginger and green cardamoms.', 29.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60', 'Beverage'),
        (3, 'Kokum Sharbat', 'Cooling traditional coastal drink made from sweet-and-sour kokum fruit extract, spiced with cumin and black salt.', 49.00, 'https://images.unsplash.com/photo-1571006682887-573562305593?w=500&auto=format&fit=crop&q=60', 'Beverage')
    ]

    cursor.executemany("INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES (?, ?, ?, ?, ?, ?)", r1_items + r2_items + r3_items)

    # 4. Reviews
    reviews_data = [
        (5, 1, 5, 'The Butter Chicken here is absolutely heavenly! Perfectly spiced and sweet. Best in NCR.'),
        (6, 1, 4, 'Very good Paneer Tikka. Tender and fresh. Highly recommended.'),
        (5, 2, 5, 'Best Masala Dosa in Indiranagar. The filter coffee has the perfect strength and froth!'),
        (6, 2, 4, 'Fluffy idlis and crispy vadas. Chutney was slightly watery but tasted amazing.'),
        (5, 3, 4, 'Excellent Pav Bhaji. Samosa chaat was sweet and tangy. Very authentic Mumbai taste.'),
        (6, 3, 5, 'Best Vada Pav outside Maharashtra. Super spicy red and green garlic chutney!')
    ]
    cursor.executemany("INSERT INTO reviews (customer_id, restaurant_id, rating, comment) VALUES (?, ?, ?, ?)", reviews_data)

    # 5. Orders (Pre-existing orders for display)
    # Order 1: Pending for Restaurant 1 (Spice Symphony) from Amit Sharma (user_id 5)
    cursor.execute("""
    INSERT INTO orders (customer_id, restaurant_id, total_price, status, delivery_address) 
    VALUES (5, 1, 448.00, 'Pending', 'Flat 402, Shiv Shakti Apartments, Sector 15, Vashi, Navi Mumbai')
    """)
    order_id_1 = cursor.lastrowid
    cursor.executemany("INSERT INTO order_items (order_id, menu_item_id, price, quantity) VALUES (?, ?, ?, ?)", [
        (order_id_1, 3, 349.00, 1), # Butter Chicken
        (order_id_1, 5, 99.00, 1)    # Gulab Jamun
    ])

    # Order 2: Delivered for Restaurant 2 (Dakshin Delights) from Priya Patel (user_id 6)
    cursor.execute("""
    INSERT INTO orders (customer_id, restaurant_id, total_price, status, delivery_address) 
    VALUES (6, 2, 347.00, 'Delivered', 'House No. 12, Block C, Noida Sector 62, Uttar Pradesh')
    """)
    order_id_2 = cursor.lastrowid
    cursor.executemany("INSERT INTO order_items (order_id, menu_item_id, price, quantity) VALUES (?, ?, ?, ?)", [
        (order_id_2, 9, 149.00, 1), # Dosa
        (order_id_2, 10, 189.00, 1), # Paneer Ghee Roast Dosa
        (order_id_2, 12, 49.00, 2)   # Filter Coffee * 2
    ])

    conn.commit()
    conn.close()
    print("Database successfully initialized with Indian items!")

if __name__ == '__main__':
    init_db()
