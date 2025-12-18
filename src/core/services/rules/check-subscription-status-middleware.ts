import type { Either } from '../../utils/either';
import { left, right } from '../../utils/either';
import {
  type CheckSubscriptionStatusService,
  SubscriptionAccessLevel,
} from '../check-subscription-status-service';
import { ErrorSubscriptionAccessBlocked } from '../errors/error-subscription-access-blocked';
import type { ErrorSubscriptionNotFound } from '../errors/error-subscription-not-found';
import { ErrorSubscriptionReadOnly } from '../errors/error-subscription-read-only';

export type SubscriptionOperation = 'read' | 'write';

export type SubscriptionMiddlewareError =
  | ErrorSubscriptionNotFound
  | ErrorSubscriptionReadOnly
  | ErrorSubscriptionAccessBlocked;

export interface SubscriptionAccessMiddleware {
  enforceAccess(request: {
    professionalId: string;
    operation: SubscriptionOperation;
  }): Promise<Either<SubscriptionMiddlewareError, null>>;
}

export class CheckSubscriptionStatusMiddleware
  implements SubscriptionAccessMiddleware {
  constructor(
    private checkSubscriptionStatusService: CheckSubscriptionStatusService
  ) {}

  async enforceAccess({
    professionalId,
    operation,
  }: {
    professionalId: string;
    operation: SubscriptionOperation;
  }): Promise<Either<SubscriptionMiddlewareError, null>> {
    const result = await this.checkSubscriptionStatusService.handle({
      professionalId,
    });

    if (result.isLeft()) {
      return left(result.value);
    }

    return this.applyAccessRules(result.value.accessLevel, operation);
  }

  private applyAccessRules(
    accessLevel: SubscriptionAccessLevel,
    operation: SubscriptionOperation
  ): Either<SubscriptionMiddlewareError, null> {
    if (accessLevel === SubscriptionAccessLevel.Blocked) {
      return left(new ErrorSubscriptionAccessBlocked());
    }

    if (
      accessLevel === SubscriptionAccessLevel.GraceReadOnly &&
      operation === 'write'
    ) {
      return left(new ErrorSubscriptionReadOnly());
    }

    return right(null);
  }
}
