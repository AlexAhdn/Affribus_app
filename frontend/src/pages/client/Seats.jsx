import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';

function Seats() {
  const { routeId } = useParams();
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // On récupère les routes pour avoir le bus_id
    api.get(`/routes?route_id=${routeId}`)
      .then(res => {
        const busId = res.data[0].bus.id;
        return api.get(`/buses/${busId}/seats`);
      })
      .then(res => setSeats(res.data))
      .catch(err => console.error(err));
  }, [routeId]);

  const handleReserve = () => {
    if (!selectedSeat) return;
    api.post('/tickets', { route_id: routeId, seat_id: selectedSeat.id })
       .then(res => navigate(`/payment/${res.data.id}`))
       .catch(err => console.error(err));
  };

  return (
    <div>
      <h2>Choisir le siège</h2>
      <ul>
        {seats.map(seat => (
          <li key={seat.id}>
            Siège {seat.seat_number} 
            <button onClick={() => setSelectedSeat(seat)}>Sélectionner</button>
          </li>
        ))}
      </ul>
      <button onClick={handleReserve}>Réserver</button>
    </div>
  );
}

export default Seats;