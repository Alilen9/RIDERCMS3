interface Props {
  sessions: any[];
}

const RentalSessions = ({
  sessions,
}: Props) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">

      <h2 className="text-white text-xl mb-4">
        Active Rentals
      </h2>

      <table className="w-full">
        <thead>
          <tr className="text-gray-500 text-sm">
            <th>Rider</th>
            <th>Battery</th>
            <th>Duration</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>{session.riderName}</td>
              <td>{session.rentalBatteryId}</td>
              <td>{session.durationMinutes} min</td>
              <td>KES {session.amount}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
};

export default RentalSessions;