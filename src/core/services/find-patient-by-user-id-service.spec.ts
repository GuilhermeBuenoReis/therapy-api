import { InMemoryPatientRepository } from '../../../test/repositories/in-memory-patient-repository';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { Patient } from '../entities/patient';
import { User } from '../entities/user';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { ErrorPatientNotFound } from './errors/patient-not-found';
import { ErrorUserNotFound } from './errors/user-not-found';
import { FindPatientByUserIdService } from './find-patient-by-user-id-service';

let sut: FindPatientByUserIdService;
let inMemoryPatientRepository: InMemoryPatientRepository;
let inMemoryUserRepository: InMemoryUserRepository;

describe('Find Patient By User Id Service', () => {
  beforeEach(() => {
    inMemoryPatientRepository = new InMemoryPatientRepository();
    inMemoryUserRepository = new InMemoryUserRepository();

    sut = new FindPatientByUserIdService(
      inMemoryPatientRepository,
      inMemoryUserRepository
    );
  });

  it('should be able to find a patient by user id', async () => {
    const user = User.create(
      {
        name: 'John Doe',
        email: 'jhondoe@gmail.com',
        password: '123456',
      },
      new UniqueEntityID('user-01')
    );

    await inMemoryUserRepository.create(user);

    const patient = Patient.create(
      {
        userId: user.id.toString(),
        professionalsId: 'professional-01',
        name: 'Patient Name',
        birthDate: '1990-01-01',
        phone: '123456789',
        note: 'note',
      },
      new UniqueEntityID('patient-01')
    );

    await inMemoryPatientRepository.create(patient);

    const result = await sut.handle({
      userId: user.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.patient.id.toString()).toEqual('patient-01');
      expect(result.value.patient.userId).toEqual(user.id.toString());
    }
  });

  it('should return left when user not found', async () => {
    const result = await sut.handle({
      userId: 'missing-user',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorUserNotFound);
    }
  });

  it('should return left when patient not found for user', async () => {
    const user = User.create(
      {
        name: 'John Doe',
        email: 'jhondoe@gmail.com',
        password: '123456',
      },
      new UniqueEntityID('user-02')
    );

    await inMemoryUserRepository.create(user);

    const result = await sut.handle({
      userId: user.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ErrorPatientNotFound);
    }
  });
});
