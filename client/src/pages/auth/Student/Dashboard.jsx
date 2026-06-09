const Dashboard = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Student Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-4 mt-8">
        <div className="bg-white shadow p-4 rounded">
          Profile Status
        </div>

        <div className="bg-white shadow p-4 rounded">
          Preference Status
        </div>

        <div className="bg-white shadow p-4 rounded">
          Deadline
        </div>

        <div className="bg-white shadow p-4 rounded">
          Allotment
        </div>
      </div>
    </div>
  );
};

export default Dashboard;