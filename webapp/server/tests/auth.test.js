const nock = require('nock');
const { refreshAccessToken, getAccessToken, setAccessToken, setRefreshToken } = require('../auth');

describe('Spotify Authentication', () => {
  let originalAccessToken;
  let originalRefreshToken;
  let originalSetTimeout;

  beforeEach(() => {
    // Clean all mocks
    nock.cleanAll();

    // Backup the original tokens
    originalAccessToken = getAccessToken();
    originalRefreshToken = global.refreshToken;

    // Set mock tokens for testing
    setAccessToken(undefined);
    setRefreshToken('mock-refresh-token');

    // Mock setTimeout to prevent automatic refresh
    originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn();
  });

  afterEach(() => {
    // Restore the original tokens
    setAccessToken(originalAccessToken);
    setRefreshToken(originalRefreshToken);

    // Restore the original setTimeout
    global.setTimeout = originalSetTimeout;
  });

  it('should refresh the access token', async () => {
    const newAccessToken = 'mock-new-access-token';

    // Mock the response from Spotify
    nock('https://accounts.spotify.com')
      .post('/api/token')
      .reply(200, {
        access_token: newAccessToken,
        expires_in: 3600,
      });

    await refreshAccessToken();

    expect(getAccessToken()).toBe(newAccessToken);
  });

  it('should handle refresh token failure', async () => {
    // Mock the response from Spotify with an error
    nock('https://accounts.spotify.com')
      .post('/api/token')
      .reply(400, {
        error: 'invalid_grant',
      });

    await refreshAccessToken();

    expect(getAccessToken()).toBeUndefined();
  });
});
