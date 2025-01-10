document.addEventListener('DOMContentLoaded', function () {
    // Example for handling form submission for flight search
    document.getElementById('searchFlightForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const origin = document.getElementById('search_origin').value;
        const destination = document.getElementById('search_destination').value;

        try {
            const response = await fetch(`/search-flights?origin=${origin}&destination=${destination}`);
            const flights = await response.json();

            const resultsDiv = document.getElementById('searchResults');
            resultsDiv.innerHTML = flights.length
                ? flights.map(f => `<p>Flight ID: ${f.flight_id}, Price: ${f.price}, Seats: ${f.available_seats}</p>`).join('')
                : 'No flights found.';
        } catch (error) {
            console.error('Error searching flights:', error);
            alert('Failed to search flights.');
        }
    });
});
