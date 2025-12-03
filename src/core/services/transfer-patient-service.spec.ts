import { beforeEach, describe, expect, it } from 'vitest';
import { makePatient } from '../../../test/factories/make-patient';
import { makeProfessionals } from '../../../test/factories/make-professionals';
import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { InMemoryPatientTransferHistoryRepository } from '../../../test/repositories/in-memory-patient-transfer-history-repository';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorPatientNotLinkedToProfessional } from './errors/patient-not-linked-to-a-professional';
import { ErrorProfessionalsNotFound } from './errors/professionals-not-found';
import { TransferPatientService } from './transfer-patient-service';

let sut: TransferPatientService;
let inMemoryPatientRepository: InMemoryPatientRepository;
let inMemoryProfessionalsRepository: InMemoryProfessionalsRepository;
let inMemoryPatientTransferHistoryRepository: InMemoryPatientTransferHistoryRepository;

describe('Transfer Patient Service', () => {
  beforeEach(() => {
    inMemoryPatientRepository = new InMemoryPatientRepository();
    inMemoryProfessionalsRepository = new InMemoryProfessionalsRepository();
    inMemoryPatientTransferHistoryRepository =
      new InMemoryPatientTransferHistoryRepository();

    sut = new TransferPatientService(
      inMemoryPatientRepository,
      inMemoryProfessionalsRepository,
      inMemoryPatientTransferHistoryRepository
    );
  });

  it('should transfer patient and record history', async () => {
    const originProfessional = makeProfessionals(
      {},
      new UniqueEntityID('professional-origin')
    );

    const destinationProfessional = makeProfessionals(
      {},
      new UniqueEntityID('professional-destination')
    );

    await inMemoryProfessionalsRepository.create(originProfessional);
    await inMemoryProfessionalsRepository.create(destinationProfessional);

    const patient = makePatient(
      { professionalsId: originProfessional.id.toString() },
      new UniqueEntityID('patient-01')
    );

    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      originProfessionalId: originProfessional.id.toString(),
      destinationProfessionalId: destinationProfessional.id.toString(),
      reason: 'Change of specialization',
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryPatientRepository.items[0].professionalsId).toBe(
      destinationProfessional.id.toString()
    );
    expect(inMemoryPatientTransferHistoryRepository.items).toHaveLength(1);
    expect(
      inMemoryPatientTransferHistoryRepository.items[0].originProfessional
    ).toBe(originProfessional.id.toString());
    expect(
      inMemoryPatientTransferHistoryRepository.items[0].destinationProfessional
    ).toBe(destinationProfessional.id.toString());
    expect(inMemoryPatientTransferHistoryRepository.items[0].patientId).toBe(
      patient.id.toString()
    );
    expect(inMemoryPatientTransferHistoryRepository.items[0].reason).toBe(
      'Change of specialization'
    );
  });

  it('should return error when patient does not exist', async () => {
    const result = await sut.handle({
      patientId: 'non-existent-patient',
      originProfessionalId: 'professional-origin',
      destinationProfessionalId: 'professional-destination',
      reason: 'Not used',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotFound);
    }
  });

  it('should return error when origin professional does not exist', async () => {
    const destinationProfessional = makeProfessionals(
      {},
      new UniqueEntityID('professional-destination')
    );
    await inMemoryProfessionalsRepository.create(destinationProfessional);

    const patient = makePatient(
      { professionalsId: 'professional-origin' },
      new UniqueEntityID('patient-01')
    );
    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      originProfessionalId: 'missing-origin',
      destinationProfessionalId: destinationProfessional.id.toString(),
      reason: 'Invalid origin',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorProfessionalsNotFound);
    }
  });

  it('should return error when destination professional does not exist', async () => {
    const originProfessional = makeProfessionals(
      {},
      new UniqueEntityID('professional-origin')
    );
    await inMemoryProfessionalsRepository.create(originProfessional);

    const patient = makePatient(
      { professionalsId: originProfessional.id.toString() },
      new UniqueEntityID('patient-01')
    );
    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      originProfessionalId: originProfessional.id.toString(),
      destinationProfessionalId: 'missing-destination',
      reason: 'Invalid destination',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorProfessionalsNotFound);
    }
  });

  it('should return error when patient is not linked to origin professional', async () => {
    const originProfessional = makeProfessionals(
      {},
      new UniqueEntityID('professional-origin')
    );
    const destinationProfessional = makeProfessionals(
      {},
      new UniqueEntityID('professional-destination')
    );

    await inMemoryProfessionalsRepository.create(originProfessional);
    await inMemoryProfessionalsRepository.create(destinationProfessional);

    const patient = makePatient(
      { professionalsId: 'other-professional' },
      new UniqueEntityID('patient-01')
    );
    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      patientId: patient.id.toString(),
      originProfessionalId: originProfessional.id.toString(),
      destinationProfessionalId: destinationProfessional.id.toString(),
      reason: 'Mismatch origin',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotLinkedToProfessional);
    }
  });
});
