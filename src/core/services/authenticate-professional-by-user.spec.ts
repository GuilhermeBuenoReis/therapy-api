import { FakeHasher } from '../../../test/cryptography/fake-hasher';
import { FakeAuthSessionGateway } from '../../../test/gateways/fake-auth-session-gateway';
import { InMemoryProfessionalsRepository } from '../../../test/repositories/in-memory-professionals-repository';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { Professionals } from '../entities/professionals';
import { User, UserRole } from '../entities/user';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { AuthenticateProfessionalService } from './authenticate-professional-by-user';
import { ProfessionalProfileNotFoundError } from './errors/professional-profile-not-found-error';
import { ProfessionalRoleRequiredError } from './errors/professional-role-required-error';
import { WrongCredentialsError } from './errors/wrong-creadentials-error';

let inMemoryUserRepository: InMemoryUserRepository;
let inMemoryProfessionalsRepository: InMemoryProfessionalsRepository;
let fakeHashComparer: FakeHasher;
let fakeAuthSessionGateway: FakeAuthSessionGateway;
let sut: AuthenticateProfessionalService;

describe('Authenticate Professional By User', () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();
    inMemoryProfessionalsRepository = new InMemoryProfessionalsRepository();
    fakeHashComparer = new FakeHasher();
    fakeAuthSessionGateway = new FakeAuthSessionGateway();

    sut = new AuthenticateProfessionalService(
      inMemoryUserRepository,
      inMemoryProfessionalsRepository,
      fakeHashComparer,
      fakeAuthSessionGateway
    );
  });

  it('should authenticate and return an access token', async () => {
    const hashedPassword = await fakeHashComparer.hash('valid-password');

    const user = User.create(
      {
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: hashedPassword,
      },
      new UniqueEntityID('user-01')
    );

    await inMemoryUserRepository.create(user);
    const professional = Professionals.create({
      userId: user.id,
      specialty: 'Psicologia',
      registration_number: 'CRP123456',
      phone: '551999999999',
      biography: 'Experiente em atendimentos clínicos.',
      pricePerSession: 150,
      monthlyPrice: 900,
      sessionDuration: 60,
    });

    await inMemoryProfessionalsRepository.create(professional);

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: 'valid-password',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.sessionToken).toContain('"userId":"user-01"');
      expect(result.value.sessionExpiresAt).toBeInstanceOf(Date);
      expect(result.value.authenticatedUser).toEqual({
        userId: 'user-01',
        professionalId: professional.id.toString(),
        role: UserRole.Professional,
        email: 'johndoe@example.com',
      });
    }
  });

  it('should not authenticate when user is not found', async () => {
    const result = await sut.execute({
      email: 'unknown@example.com',
      password: 'any-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError);
    }
  });

  it('should not authenticate when password is invalid', async () => {
    const hashedPassword = await fakeHashComparer.hash('valid-password');

    const user = User.create({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: hashedPassword,
    });

    await inMemoryUserRepository.create(user);
    const professional = Professionals.create({
      userId: user.id,
      specialty: 'Psicologia',
      registration_number: 'CRP123456',
      phone: '551999999999',
      biography: 'Experiente em atendimentos clínicos.',
      pricePerSession: 150,
      monthlyPrice: 900,
      sessionDuration: 60,
    });

    await inMemoryProfessionalsRepository.create(professional);

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: 'wrong-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError);
    }
  });

  it('should not authenticate when user role is not professional', async () => {
    const hashedPassword = await fakeHashComparer.hash('valid-password');

    const user = User.create({
      name: 'Jane Patient',
      email: 'janepatient@example.com',
      password: hashedPassword,
      role: UserRole.Patient,
    });

    await inMemoryUserRepository.create(user);

    const result = await sut.execute({
      email: 'janepatient@example.com',
      password: 'valid-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProfessionalRoleRequiredError);
    }
  });

  it('should not authenticate when professional profile is missing', async () => {
    const hashedPassword = await fakeHashComparer.hash('valid-password');

    const user = User.create({
      name: 'John Doe',
      email: 'johndoe2@example.com',
      password: hashedPassword,
    });

    await inMemoryUserRepository.create(user);

    const result = await sut.execute({
      email: 'johndoe2@example.com',
      password: 'valid-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProfessionalProfileNotFoundError);
    }
  });
});
