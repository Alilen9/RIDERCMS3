interface Props {
  available: number;
  issued: number;
  charging: number;
  maintenance: number;
}

const RentalOverview = ({
  available,
  issued,
  charging,
  maintenance,
}: Props) => {
  const cards = [
    {
      title: 'Available',
      value: available,
    },
    {
      title: 'Issued',
      value: issued,
    },
    {
      title: 'Charging',
      value: charging,
    },
    {
      title: 'Maintenance',
      value: maintenance,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-gray-900 rounded-3xl p-6 border border-gray-800"
        >
          <p className="text-gray-500 text-sm">
            {card.title}
          </p>

          <h2 className="text-3xl text-white font-bold mt-2">
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
};

export default RentalOverview;