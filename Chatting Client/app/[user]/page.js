import moment from "moment";

const UserHome = () => {
  const formattedDate = moment().format("dddd, MMMM Do YYYY");

  return (
    <div className='bg-background py-2'>
      <div>
        <p className=' text-gray-500 ml-6'>Today {formattedDate}</p>
      </div>
      <div className='text-center'>
        <h1 className='text-2xl font-semibold text-gray-700'>
          Welcome to Chat
        </h1>
        <p className='text-gray-500 mt-2'>
          Select a conversation to start chatting
        </p>
      </div>
    </div>
  );
};

export default UserHome;
