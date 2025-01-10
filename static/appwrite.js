// Import Appwrite modules
import { Client, Account, Databases, Storage } from "appwrite";

// Initialize Appwrite Client
const client = new Client();
client
  .setEndpoint('<YOUR_APPWRITE_ENDPOINT>') // Replace with your Appwrite endpoint
  .setProject('<YOUR_PROJECT_ID>'); // Replace with your project ID

// Initialize Appwrite Services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Replace with your database and collection IDs
const databaseId = '<YOUR_DATABASE_ID>';
const collectionId = '<YOUR_COLLECTION_ID>';
const bucketId = '<YOUR_BUCKET_ID>';

// Appwrite Functions
const appwriteFunctions = {
  // User Authentication
  signUp: async (email, password, name) => {
    try {
      const response = await account.create(email, password, name);
      console.log('User Signed Up:', response);
    } catch (error) {
      console.error('Sign-Up Error:', error);
    }
  },

  logIn: async (email, password) => {
    try {
      const response = await account.createEmailSession(email, password);
      console.log('User Logged In:', response);
    } catch (error) {
      console.error('Log-In Error:', error);
    }
  },

  logOut: async () => {
    try {
      await account.deleteSession('current');
      console.log('User Logged Out');
    } catch (error) {
      console.error('Log-Out Error:', error);
    }
  },

  getUser: async () => {
    try {
      const response = await account.get();
      console.log('Current User:', response);
    } catch (error) {
      console.error('Get User Error:', error);
    }
  },

  // Database Operations
  createDocument: async (data) => {
    try {
      const response = await databases.createDocument(databaseId, collectionId, 'unique()', data);
      console.log('Document Created:', response);
    } catch (error) {
      console.error('Create Document Error:', error);
    }
  },

  getDocuments: async () => {
    try {
      const response = await databases.listDocuments(databaseId, collectionId);
      console.log('Documents:', response.documents);
    } catch (error) {
      console.error('Get Documents Error:', error);
    }
  },

  // Search Flights (from the database)
  searchFlights: async (origin, destination) => {
    try {
      const response = await databases.listDocuments(databaseId, collectionId, {
        filters: `origin=${origin}&destination=${destination}&available_seats>0`
      });
      console.log('Available Flights:', response.documents);
    } catch (error) {
      console.error('Search Flights Error:', error);
    }
  },

  // Book Ticket (update the available seats)
  bookTicket: async (flightId, passengerName) => {
    try {
      const flight = await databases.getDocument(databaseId, collectionId, flightId);
      if (flight.available_seats > 0) {
        // Decrease available seats
        const updatedFlight = {
          available_seats: flight.available_seats - 1,
        };
        const response = await databases.updateDocument(databaseId, collectionId, flightId, updatedFlight);
        
        // Create the booking document
        const bookingData = {
          flight_id: flightId,
          passenger_name: passengerName,
          price: flight.price,
        };
        await databases.createDocument('<YOUR_BOOKING_DATABASE_ID>', '<YOUR_BOOKING_COLLECTION_ID>', 'unique()', bookingData);
        
        console.log('Booking Success:', response);
      } else {
        console.log('No available seats on this flight');
      }
    } catch (error) {
      console.error('Book Ticket Error:', error);
    }
  },

  // File Storage
  uploadFile: async (file) => {
    try {
      const response = await storage.createFile(bucketId, 'unique()', file);
      console.log('File Uploaded:', response);
    } catch (error) {
      console.error('Upload File Error:', error);
    }
  },

  listFiles: async () => {
    try {
      const response = await storage.listFiles(bucketId);
      console.log('Files:', response.files);
    } catch (error) {
      console.error('List Files Error:', error);
    }
  },
};

// Event Listeners for the Frontend
document.addEventListener('DOMContentLoaded', () => {
  // Sign Up
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value;
    await appwriteFunctions.signUp(email, password, name);
  });

  // Log In
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await appwriteFunctions.logIn(email, password);
  });

  // Log Out
  document.getElementById('logoutButton').addEventListener('click', async () => {
    await appwriteFunctions.logOut();
  });

  // Get User Info
  document.getElementById('getUserButton').addEventListener('click', async () => {
    await appwriteFunctions.getUser();
  });

  // Add Flight (Database Operation)
  document.getElementById('addFlightForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const flightId = document.getElementById('flightId').value;
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const price = document.getElementById('price').value;
    const seats = document.getElementById('seats').value;

    const flightData = {
      flight_id: flightId,
      origin: origin,
      destination: destination,
      price: price,
      seats: seats,
    };

    await appwriteFunctions.createDocument(flightData);
  });

  // Search Flights
  document.getElementById('searchFlightForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const origin = document.getElementById('searchOrigin').value;
    const destination = document.getElementById('searchDestination').value;
    await appwriteFunctions.searchFlights(origin, destination);
  });

  // Book Ticket
  document.getElementById('bookTicketForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const flightId = document.getElementById('bookFlightId').value;
    const passengerName = document.getElementById('passengerName').value;
    await appwriteFunctions.bookTicket(flightId, passengerName);
  });

  // Upload File
  document.getElementById('uploadFileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (file) {
      await appwriteFunctions.uploadFile(file);
    } else {
      console.log("No file selected.");
    }
  });
});

export default appwriteFunctions;
