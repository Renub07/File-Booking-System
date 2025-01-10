from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.account import Account
import os

# Initialize Flask app and enable CORS for cross-origin requests
app = Flask(__name__)
CORS(app)

# Initialize Appwrite Client
client = Client()
client.set_endpoint('<YOUR_APPWRITE_ENDPOINT>')  # Replace with your Appwrite endpoint
client.set_project('<YOUR_PROJECT_ID>')  # Replace with your Appwrite project ID
client.set_key('<YOUR_API_KEY>')  # Replace with your Appwrite API key

# Initialize Appwrite Services
account = Account(client)
databases = Databases(client)
storage = Storage(client)

# FlightBookingSystem class
class FlightBookingSystem:
    def __init__(self):
        self.flight_graph = {}  # Graph to store routes between airports

    # Add flight to Appwrite database
    def add_flight(self, flight_id, origin, destination, price, seats):
        try:
            # Flight data
            flight_data = {
                'origin': origin,
                'destination': destination,
                'price': int(price),
                'seats': int(seats),
                'available_seats': int(seats)
            }
            # Save flight to Appwrite database
            response = databases.create_document('<YOUR_DATABASE_ID>', '<YOUR_COLLECTION_ID>', flight_id, flight_data)
            return f"Flight {flight_id} added successfully!", True
        except Exception as e:
            return f"Error adding flight: {str(e)}", False

    # Search flights from Appwrite database
    def search_flights(self, origin, destination):
        try:
            # Query flights based on origin, destination, and available seats
            flights = databases.list_documents('<YOUR_DATABASE_ID>', '<YOUR_COLLECTION_ID>', filters=f"origin={origin}&destination={destination}&available_seats>0")
            return flights['documents']
        except Exception as e:
            return f"Error searching flights: {str(e)}", False

    # Book a ticket by saving the booking in Appwrite database
    def book_ticket(self, flight_id, passenger_name):
        try:
            # Find flight document by ID
            flight = databases.get_document('<YOUR_DATABASE_ID>', '<YOUR_COLLECTION_ID>', flight_id)
            if flight['available_seats'] > 0:
                # Reduce available seats
                updated_flight = {
                    'available_seats': flight['available_seats'] - 1
                }
                databases.update_document('<YOUR_DATABASE_ID>', '<YOUR_COLLECTION_ID>', flight_id, updated_flight)

                # Save booking data
                booking_data = {
                    'flight_id': flight_id,
                    'passenger_name': passenger_name,
                    'price': flight['price']
                }
                databases.create_document('<YOUR_DATABASE_ID>', '<YOUR_BOOKING_COLLECTION_ID>', 'unique()', booking_data)

                return f"Ticket booked successfully for {passenger_name} on flight {flight_id}.", True
            else:
                return "No seats available on this flight!", False
        except Exception as e:
            return f"Error booking ticket: {str(e)}", False

    # List all flights from Appwrite database
    def list_all_flights(self):
        try:
            # Retrieve all flights
            flights = databases.list_documents('<YOUR_DATABASE_ID>', '<YOUR_COLLECTION_ID>')
            return flights['documents']
        except Exception as e:
            return f"Error listing flights: {str(e)}", False

# Initialize the booking system
system = FlightBookingSystem()

# Routes for handling frontend requests
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add-flight', methods=['POST'])
def add_flight():
    try:
        data = request.json
        flight_id = data.get("flight_id")
        origin = data.get("origin")
        destination = data.get("destination")
        price = data.get("price")
        seats = data.get("seats")
        message, success = system.add_flight(flight_id, origin, destination, price, seats)
        status_code = 201 if success else 400
        return jsonify({"message": message}), status_code
    except Exception as e:
        return jsonify({"message": f"Error adding flight: {str(e)}"}), 500

@app.route('/search-flights', methods=['GET'])
def search_flights():
    origin = request.args.get("origin")
    destination = request.args.get("destination")
    if not origin or not destination:
        return jsonify({"message": "Origin and destination are required!"}), 400

    flights = system.search_flights(origin, destination)
    if isinstance(flights, list) and len(flights) > 0:
        return jsonify(flights), 200
    else:
        return jsonify({"message": "No flights found or an error occurred!"}), 404

@app.route('/book-ticket', methods=['POST'])
def book_ticket():
    try:
        data = request.json
        flight_id = data.get("flight_id")
        passenger_name = data.get("passenger_name")

        if not all([flight_id, passenger_name]):
            return jsonify({"message": "Flight ID and passenger name are required!"}), 400

        message, success = system.book_ticket(flight_id, passenger_name)
        status_code = 200 if success else 400
        return jsonify({"message": message}), status_code
    except Exception as e:
        return jsonify({"message": f"Error booking ticket: {str(e)}"}), 500

@app.route('/list-flights', methods=['GET'])
def list_flights():
    flights = system.list_all_flights()
    if isinstance(flights, list) and len(flights) > 0:
        return jsonify(flights), 200
    else:
        return jsonify({"message": "No flights available!"}), 404

@app.route('/upload-file', methods=['POST'])
def upload_file():
    try:
        file = request.files['file']
        if not file:
            return jsonify({"message": "No file provided!"}), 400
        
        # Upload file to Appwrite Storage
        response = storage.create_file('<YOUR_BUCKET_ID>', 'unique()', file)
        return jsonify({"message": "File uploaded successfully", "file": response}), 200
    except Exception as e:
        return jsonify({"message": f"Error uploading file: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
