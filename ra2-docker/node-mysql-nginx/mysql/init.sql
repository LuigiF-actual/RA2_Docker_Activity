CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id)
);

INSERT INTO products (name, category, price) VALUES
  ('Docker Handbook', 'Books', 24.90),
  ('Nginx Sticker', 'Accessories', 2.50),
  ('Node.js Mug', 'Accessories', 9.95);
