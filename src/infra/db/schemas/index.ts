import { patient } from './patient';
import { payment, paymentMethodEnum, paymentTypeEnum } from './payment';
import { professional } from './professional';
import { session, statusEnum } from './session';
import { subscription, subscriptionStatusEnum } from './subscription';
import { user, userRoleEnum } from './user';

export const schemas = {
  user,
  professional,
  patient,
  payment,
  subscription,
  session,

  paymentTypeEnum,
  paymentMethodEnum,
  statusEnum,
  subscriptionStatusEnum,
  userRoleEnum,
};
