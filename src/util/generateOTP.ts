const generateOTP = () => {
  return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
};

export default generateOTP;
