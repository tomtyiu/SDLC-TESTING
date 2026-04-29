import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBox from './SearchBox';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('<SearchBox />', () => {
  it('shows results from /api/geocode and fires onSelect', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            results: [
              {
                id: 1,
                name: 'London',
                country: 'United Kingdom',
                admin1: 'England',
                latitude: 51.5,
                longitude: -0.12,
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<SearchBox onSelect={onSelect} />);

    await user.type(
      screen.getByPlaceholderText(/search for a city/i),
      'Lon',
    );

    const option = await screen.findByRole('option', {}, { timeout: 2000 });
    await user.click(option);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'London' }),
    );
  });

  it('shows an error message on fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('boom', { status: 500 })),
    );
    const user = userEvent.setup();
    render(<SearchBox onSelect={() => {}} />);
    await user.type(
      screen.getByPlaceholderText(/search for a city/i),
      'Foo',
    );
    await waitFor(
      () => expect(screen.getByRole('alert')).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });
});
