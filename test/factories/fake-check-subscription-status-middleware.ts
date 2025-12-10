import type {
  SubscriptionAccessMiddleware,
  SubscriptionMiddlewareError,
  SubscriptionOperation,
} from '../../src/core/services/rules/check-subscription-status-middleware';
import type { Either } from '../../src/core/utils/either';
import { right } from '../../src/core/utils/either';

export class FakeCheckSubscriptionStatusMiddleware
  implements SubscriptionAccessMiddleware {
  async enforceAccess({
    professionalId,
    operation,
  }: {
    professionalId: string;
    operation: SubscriptionOperation;
  }): Promise<Either<SubscriptionMiddlewareError, null>> {
    void professionalId;
    void operation;
    return right(null);
  }
}
