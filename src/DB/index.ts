import colors from 'colors';
import { User } from '../app/modules/user/user.model';
import config from '../config';
import { USER_ROLES } from '../enums/user';
import { logger } from '../shared/logger';

const superUser = {
  name: 'Nayon',
  role: USER_ROLES.ADMIN,
  email: config.admin.email,
  password: config.admin.password,
  image: '',
  verified: true,
};

const seedAdmin = async () => {
  const isExistSuperAdmin = await User.findOne({
    role: USER_ROLES.ADMIN,
  });

  if (!isExistSuperAdmin) {
    await User.create(superUser);
    logger.info(colors.green('✔ Admin created successfully!'));
  }
};

export default seedAdmin;
