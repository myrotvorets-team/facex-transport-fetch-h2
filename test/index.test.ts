import * as f from '@adobe/helix-fetch';
import { FaceXError, HttpError, NetworkError } from '@myrotvorets/facex-base';
import { TransportFetch } from '../lib';

jest.mock('@adobe/helix-fetch');

const mockedFetch = f.fetch as jest.MockedFunction<typeof f.fetch>; // NOSONAR
const { Response } = jest.requireActual<typeof f>('@adobe/helix-fetch');

describe('TransportFetch', () => {
    const transport = new TransportFetch();

    it('should throw NetworkError on fetch error', () => {
        const r = new Error('message');
        mockedFetch.mockRejectedValue(r);

        return expect(transport.post(new URL('http://example.com/'), '', {})).rejects.toThrow(NetworkError);
    });

    it('should throw HttpError on HTTP error (1)', () => {
        const r = new Response('Ignored', { status: 404, statusText: 'Not Found' });
        mockedFetch.mockResolvedValue(r);

        return expect(transport.post(new URL('http://example.com/'), '', {})).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on HTTP error (2)', () => {
        const r = new Response('Ignored', { status: 404, statusText: 'Not Found' });
        mockedFetch.mockResolvedValue(r);

        return expect(transport.post(new URL('http://example.com/'), '', {})).rejects.toMatchObject({
            code: 404,
            statusText: 'Not Found',
            body: 'Ignored',
        });
    });

    it('should tolerate errors in text() in HttpError handler', () => {
        const r = new Response('Ignored', { status: 400, statusText: 'Bad, Bad Request' });
        r.text = jest.fn().mockRejectedValue(new Error('Unknown error'));
        mockedFetch.mockResolvedValue(r);

        return expect(transport.post(new URL('http://example.com/'), '', {})).rejects.toMatchObject({
            code: 400,
            statusText: 'Bad, Bad Request',
            body: '',
        });
    });

    it('should throw FaceXError on any other error', () => {
        const r = new Response('Ignored', { status: 200, statusText: 'OK' });
        r.text = jest.fn().mockRejectedValue(new Error('Unknown error'));
        mockedFetch.mockResolvedValue(r);

        return expect(transport.post(new URL('http://example.com/'), '', {})).rejects.toThrow(FaceXError);
    });
});
