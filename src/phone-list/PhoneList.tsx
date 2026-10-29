import { useEffect, useMemo, useState } from 'react';
import { fetchPhones } from '../phones/api';
import { SORT_OPTIONS, filterPhones, isSortKey, sortPhones, type SortKey } from '../phones/search';
import type { PhoneSummary } from '../phones/types';
import { phoneHref } from '../routes';

/** React port of the phone-list AngularJS component. Same markup and classes, same behaviour. */
export function PhoneList() {
  const [phones, setPhones] = useState<PhoneSummary[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('age');

  useEffect(() => {
    const controller = new AbortController();
    fetchPhones(controller.signal).then(setPhones, () => {
      if (!controller.signal.aborted) setLoadFailed(true);
    });
    return () => controller.abort();
  }, []);

  const visible = useMemo(() => sortPhones(filterPhones(phones, query), sortKey), [phones, query, sortKey]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-2">
          {/*Sidebar content*/}
          <p>
            Search: <input value={query} onChange={(event) => setQuery(event.target.value)} />
          </p>
          <p>
            Sort by:{' '}
            <select
              value={sortKey}
              onChange={(event) => {
                if (isSortKey(event.target.value)) setSortKey(event.target.value);
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </p>
        </div>
        <div className="col-md-10">
          {/*Body content*/}
          {loadFailed && <p role="alert">Sorry, we could not load the phones. Please try again later.</p>}
          <ul className="phones">
            {visible.map((phone) => (
              <li key={phone.id} className="thumbnail phone-list-item">
                <a href={phoneHref(phone.id)} className="thumb">
                  <img src={phone.imageUrl} alt={phone.name} />
                </a>
                <a href={phoneHref(phone.id)}>{phone.name}</a>
                <p>{phone.snippet}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
