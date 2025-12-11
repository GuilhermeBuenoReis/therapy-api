# Business Rules (Checklist in English)

## Patient Rules
* [x] RN01 – It should be able to create a patient only if the professional exists.
* [x] RN02 – It should not be able for a patient to be attended by a professional they are not linked to.
* [x] RN03 – It should not be able for a professional to see patients that do not belong to them.
* [x] RN04 – It should be able to transfer a patient while keeping the full historical record.

## Session Rules
* [x] RN05 – It should be able to create a session only if the patient belongs to the professional.
* [x] RN06 – It should not be able to schedule sessions that create time conflicts for the professional or the patient.
* [x] RN07 – It should not be able to change the session status unless the chronological rules are respected.
* [x] RN08 – It should not be able for a cancelled session to become completed.
* [x] RN09 – It should not be able to modify chronological data or status of a completed session, but it should be able to edit price, notes, and durationMinutes.

## Medical Record Rules
* [x] RN10 – It should be able for a completed session to generate a medical record entry.
* [x] RN11 – It should be able for the medical record to contain essential clinical information.
* [x] RN12 – It should not be able for a medical record to be deleted.
* [x] RN13 – It should not be able for a professional to access medical records of patients that do not belong to them.

## Financial Rules
* [x] RN15 – It should be able to save the session value at creation time.
* [x] RN16 – It should be able to register payment value and date.
* [x] RN17 – It should not be able to edit or delete a payment.
* [x] RN18 – It should be able to generate a monthly revenue report per professional.

## Professional Rules
* [x] RN19 – It should be able to require minimum mandatory data for professionals.
* [x] RN20 – It should not be able for a professional to edit data of another professional.

## Access Rules
* [x] RN21 – It should be able for a user to be a professional or not in the future.
* [x] RN22 – It should not be able to access the dashboard without authentication.
* [x] RN23 – It should not be able for a patient to access any system resources.

## Subscription / SaaS Rules
* [x] RN24 – SaaS uses monthly subscription
  - [x] RN24.1 – It should be able to create a subscription (CreateSubscriptionService).
  - [x] RN24.2 – It should be able to check whether a subscription is active (CheckSubscriptionStatusService).
  - [x] RN24.3 – It should be able to manually renew a subscription (RenewSubscriptionService).
  - [x] RN24.4 – It should not be able to perform essential actions if the subscription is expired.
  - [x] RN24.5 – It should be able to register a subscription payment (optional PaymentLog in MVP).

* [x] RN25 – It should be able for an expired subscription to enter read-only mode for 7 days.
* [x] RN26 – It should not be able to access or perform actions after 7 days of expiration.
