import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockFetchFromPublic } from '../../tests/helpers/mockFetch';
import { PhoneList } from './PhoneList';

const names = () =>
  screen.getAllByRole('listitem').map((item) => within(item).getAllByRole('link')[1]?.textContent);

afterEach(() => vi.unstubAllGlobals());

describe('<PhoneList>', () => {
  it('shows every phone, newest first', async () => {
    mockFetchFromPublic();
    render(<PhoneList />);
    expect(await screen.findAllByRole('listitem')).toHaveLength(20);
    expect(names().slice(0, 2)).toEqual(['Motorola XOOM™ with Wi-Fi', 'MOTOROLA XOOM™']);
    expect(screen.getByRole('combobox')).toHaveValue('age');
  });

  it('filters as the user types and sorts on request', async () => {
    mockFetchFromPublic();
    const user = userEvent.setup();
    render(<PhoneList />);
    await screen.findAllByRole('listitem');

    await user.type(screen.getByRole('textbox'), 'tablet');
    expect(names()).toEqual(['Motorola XOOM™ with Wi-Fi', 'MOTOROLA XOOM™']);

    await user.selectOptions(screen.getByRole('combobox'), 'Alphabetical');
    expect(names()).toEqual(['MOTOROLA XOOM™', 'Motorola XOOM™ with Wi-Fi']);
  });

  it('links both the thumbnail and the name to the phone page', async () => {
    mockFetchFromPublic();
    render(<PhoneList />);
    const [first] = await screen.findAllByRole('listitem');
    const links = within(first!).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#!/phones/motorola-xoom-with-wi-fi',
      '#!/phones/motorola-xoom-with-wi-fi',
    ]);
  });

  it('says so when the phones cannot be loaded (new: the original showed an empty list)', async () => {
    mockFetchFromPublic({ 'phones/phones.json': 500 });
    render(<PhoneList />);
    expect(await screen.findByRole('alert')).toHaveTextContent('could not load the phones');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
