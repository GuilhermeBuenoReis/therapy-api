import { beforeEach, describe, expect, it } from 'vitest';
import { makeSubscription } from '../../../../test/factories/make-subscription';
import {
  type CheckSubscriptionStatusService,
  type CheckSubscriptionStatusServiceRequest,
  SubscriptionAccessLevel,
} from '../check-subscription-status-service';
import { CheckSubscriptionStatusMiddleware } from './check-subscription-status-middleware';
import { ErrorSubscriptionNotFound } from '../errors/error-subscription-not-found';
import { ErrorSubscriptionReadOnly } from '../errors/error-subscription-read-only';
import { ErrorSubscriptionAccessBlocked } from '../errors/error-subscription-access-blocked';
import { left, right, type Either } from '../../utils/either';
import type { Subscription } from '../../entities/subscription';

type ServiceResponse = Either<
  ErrorSubscriptionNotFound,
  { subscription: Subscription; accessLevel: SubscriptionAccessLevel }
>;

class CheckSubscriptionStatusServiceStub
  implements CheckSubscriptionStatusService
{
  private response!: ServiceResponse;

  setResponse(response: ServiceResponse) {
    this.response = response;
  }

  async handle(
    _request: CheckSubscriptionStatusServiceRequest
  ): Promise<ServiceResponse> {
    return this.response;
  }
}

describe('Check Subscription Status Middleware', () => {
  let serviceStub: CheckSubscriptionStatusServiceStub;
  let middleware: CheckSubscriptionStatusMiddleware;

  beforeEach(() => {
    serviceStub = new CheckSubscriptionStatusServiceStub();
    middleware = new CheckSubscriptionStatusMiddleware(serviceStub);
  });

  it('should allow access when subscription is active', async () => {
    const subscription = makeSubscription();
    serviceStub.setResponse(
      right({
        subscription,
        accessLevel: SubscriptionAccessLevel.Active,
      })
    );

    const result = await middleware.enforceAccess({
      professionalId: subscription.professionalId,
      operation: 'write',
    });

    expect(result.isRight()).toBe(true);
  });

  it('should block write operations during grace period', async () => {
    const subscription = makeSubscription();
    serviceStub.setResponse(
      right({
        subscription,
        accessLevel: SubscriptionAccessLevel.GraceReadOnly,
      })
    );

    const result = await middleware.enforceAccess({
      professionalId: subscription.professionalId,
      operation: 'write',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSubscriptionReadOnly);
    }
  });

  it('should allow read operations during grace period', async () => {
    const subscription = makeSubscription();
    serviceStub.setResponse(
      right({
        subscription,
        accessLevel: SubscriptionAccessLevel.GraceReadOnly,
      })
    );

    const result = await middleware.enforceAccess({
      professionalId: subscription.professionalId,
      operation: 'read',
    });

    expect(result.isRight()).toBe(true);
  });

  it('should block all operations when access level is blocked', async () => {
    const subscription = makeSubscription();
    serviceStub.setResponse(
      right({
        subscription,
        accessLevel: SubscriptionAccessLevel.Blocked,
      })
    );

    const result = await middleware.enforceAccess({
      professionalId: subscription.professionalId,
      operation: 'read',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSubscriptionAccessBlocked);
    }
  });

  it('should propagate errors from the subscription status service', async () => {
    serviceStub.setResponse(left(new ErrorSubscriptionNotFound()));

    const result = await middleware.enforceAccess({
      professionalId: 'missing-professional',
      operation: 'read',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorSubscriptionNotFound);
    }
  });
});
