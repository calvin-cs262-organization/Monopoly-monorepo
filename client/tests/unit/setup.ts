import '@testing-library/jest-native/extend-expect';
import { server } from '../../__mocks__/msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
