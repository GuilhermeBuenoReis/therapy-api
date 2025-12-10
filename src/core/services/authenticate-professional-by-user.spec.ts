import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user-repository';
import { FakeEncrypter } from '../../../test/cryptography/fake-encrypter';
import { FakeHasher } from '../../../test/cryptography/fake-hasher';
import { User } from '../entities/user';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { AuthenticateProfessionalService } from './authenticate-professional-by-user';
import { WrongCredentialsError } from './errors/wrong-creadentials-error';

let sut: AuthenticateProfessionalService;
let inMemoryUserRepository: InMemoryUserRepository;
let fakeHashComparer: FakeHasher;
let fakeEncrypter: FakeEncrypter;

describe('Authenticate Professional By User', () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();
    fakeHashComparer = new FakeHasher();
    fakeEncrypter = new FakeEncrypter();

    sut = new AuthenticateProfessionalService(
      inMemoryUserRepository,
      fakeHashComparer,
      fakeEncrypter
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

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: 'valid-password',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.accessToken).toBe(JSON.stringify({ sub: 'user-01' }));
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

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: 'wrong-password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError);
    }
  });
});
