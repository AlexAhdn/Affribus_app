import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';

function Stations() {
  const { companyId, routeId } = useParams();
  const [stations, setStations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/stations/company/${companyId}`)
       .then(res => setStations(res.data))
       .catch(err => console.error(err));
  }, [companyId]);

  return (
    <div>
      <h2>Choisir la station</h2>
      <ul>
        {stations.map(station => (
          <li key={station.id}>
            {station.name} ({station.city})
            <button onClick={() => navigate(`/seats/${routeId}`)}>Sélectionner</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Stations;