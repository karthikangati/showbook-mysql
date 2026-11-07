CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  genre VARCHAR(50) NOT NULL,
  rating DECIMAL(3,1) NOT NULL,
  language VARCHAR(50) NOT NULL,
  duration VARCHAR(20) NOT NULL,
  release_date VARCHAR(50),
  synopsis TEXT,
  poster VARCHAR(500),
  banner VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS theaters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS shows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  theater_id INT NOT NULL,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (theater_id) REFERENCES theaters(id) ON DELETE CASCADE,
  UNIQUE KEY unique_show (movie_id, theater_id, show_date, show_time)
);

CREATE TABLE IF NOT EXISTS seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  row_label CHAR(1) NOT NULL,
  seat_number INT NOT NULL,
  category VARCHAR(30) NOT NULL,
  price INT NOT NULL,
  UNIQUE KEY unique_seat (row_label, seat_number)
);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(20) PRIMARY KEY,
  user_id INT NOT NULL,
  show_id INT NOT NULL,
  status ENUM('Confirmed','Cancelled') NOT NULL DEFAULT 'Confirmed',
  subtotal INT NOT NULL,
  convenience_fee INT NOT NULL,
  total INT NOT NULL,
  payment_method VARCHAR(40) NOT NULL DEFAULT 'Demo Payment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booking_seats (
  booking_id VARCHAR(20) NOT NULL,
  seat_id INT NOT NULL,
  PRIMARY KEY (booking_id, seat_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
);