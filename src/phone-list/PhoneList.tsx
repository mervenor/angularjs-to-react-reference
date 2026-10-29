import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { phoneHref } from '../paths';
import { assetUrl, fetchPhones } from '../phones/api';
import { SORT_OPTIONS, filterPhones, isSortKey, sortPhones, type SortKey } from '../phones/search';
import type { PhoneSummary } from '../phones/types';
import { useDocumentTitle } from '../useDocumentTitle';

/** The phone list: search, sort, and a link to each phone. */
export function PhoneList() {
  const [phones, setPhones] = useState<PhoneSummary[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('age');
  useDocumentTitle('Phones');

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
      <h1 className="visually-hidden">Phones</h1>
      <div className="row">
        <div className="col-md-2">
          <p>
            <label>
              Search: <input value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          </p>
          <p>
            <label>
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
            </label>
          </p>
        </div>
        <div className="col-md-10">
          {loadFailed && <p role="alert">Sorry, we could not load the phones. Please try again later.</p>}
          {/* Announces the number of results to screen reader users as they type. */}
          <p role="status" className="visually-hidden">
            {phones.length > 0 && `${visible.length} ${visible.length === 1 ? 'phone' : 'phones'} shown`}
          </p>
          <ul className="phones">
            {visible.map((phone) => (
              <li key={phone.id} className="thumbnail phone-list-item">
                {/* The name link already says where this goes; hide the duplicate from keyboard and screen readers. */}
                <Link to={phoneHref(phone.id)} className="thumb" tabIndex={-1} aria-hidden="true">
                  <img src={assetUrl(phone.imageUrl)} alt="" />
                </Link>
                <Link to={phoneHref(phone.id)}>{phone.name}</Link>
                <p>{phone.snippet}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
