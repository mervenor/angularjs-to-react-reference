import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockFetchFromPublic } from '../../tests/helpers/mockFetch';
import { PhoneList } from './PhoneList';

const names = () => screen.getAllByRole('listitem').map((item) => within(item).getByRole('link').textContent);

const renderList = () =>
  render(
    <MemoryRouter>
      <PhoneList />
    </MemoryRouter>,
  );

afterEach(() => vi.unstubAllGlobals());

describe('<PhoneList>', () => {
  it('shows every phone, newest first', async () => {
    mockFetchFromPublic();
    renderList();
    expect(await screen.findAllByRole('listitem')).toHaveLength(20);
    expect(names().slice(0, 2)).toEqual(['Motorola XOOM™ with Wi-Fi', 'MOTOROLA XOOM™']);
    expect(screen.getByRole('combobox')).toHaveValue('age');
  });

  it('filters as the user types and sorts on request', async () => {
    mockFetchFromPublic();
    const user = userEvent.setup();
    renderList();
    await screen.findAllByRole('listitem');

    await user.type(screen.getByRole('textbox'), 'tablet');
    expect(names()).toEqual(['Motorola XOOM™ with Wi-Fi', 'MOTOROLA XOOM™']);

    await user.selectOptions(screen.getByRole('combobox'), 'Alphabetical');
    expect(names()).toEqual(['MOTOROLA XOOM™', 'Motorola XOOM™ with Wi-Fi']);
  });

  it('links both the thumbnail and the name to the phone page', async () => {
    mockFetchFromPublic();
    renderList();
    const [first] = await screen.findAllByRole('listitem');
    const links = Array.from(first!.querySelectorAll('a'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/phones/motorola-xoom-with-wi-fi',
      '/phones/motorola-xoom-with-wi-fi',
    ]);
    // Only the name link is exposed to screen readers and the keyboard.
    expect(within(first!).getByRole('link')).toHaveTextContent('Motorola XOOM\u2122 with Wi-Fi');
  });

  it('labels the controls and announces the number of results', async () => {
    mockFetchFromPublic();
    const user = userEvent.setup();
    renderList();
    await screen.findAllByRole('listitem');
    expect(screen.getByRole('status')).toHaveTextContent('20 phones shown');
    await user.type(screen.getByLabelText('Search:'), 'nexus');
    expect(screen.getByRole('status')).toHaveTextContent('1 phone shown');
    expect(screen.getByLabelText('Sort by:')).toHaveValue('age');
  });

  it('says so when the phones cannot be loaded (new: the original showed an empty list)', async () => {
    mockFetchFromPublic({ 'data/phones/phones.json': 500 });
    renderList();
    expect(await screen.findByRole('alert')).toHaveTextContent('could not load the phones');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
