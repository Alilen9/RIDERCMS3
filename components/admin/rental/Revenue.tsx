interface Props {
  today: number;
}

const RentalRevenue = ({
  today,
}: Props) => {
  return (
    <div className="bg-indigo-600 rounded-3xl p-6">

      <p className="text-indigo-200">
        Rental Revenue Today
      </p>

      <h2 className="text-4xl font-bold text-white mt-2">
        KES {today.toLocaleString()}
      </h2>

    </div>
  );
};

export default RentalRevenue;