import { patient, patientRelations } from './patient';
import { payment, paymentMethodEnum, paymentRelations, paymentTypeEnum } from './payment';
import { professional, professionalRelations } from './professional';
import { session, sessionRelations, statusEnum } from './session';
import { subscription, subscriptionRelations, subscriptionStatusEnum } from './subscription';
import { user, userRelations, userRoleEnum } from './user';

export const schemas = {
  user,
  userRelations,
  professional,
  professionalRelations,
  patient,
  patientRelations,
  payment,
  paymentRelations,
  subscription,
  subscriptionRelations,
  session,
  sessionRelations,

  paymentTypeEnum,
  paymentMethodEnum,
  statusEnum,
  subscriptionStatusEnum,
  userRoleEnum,
};
