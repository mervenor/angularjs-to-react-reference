import { useEffect, useState } from 'react';
import { PhoneApiError, assetUrl, fetchPhone } from '../phones/api';
import { checkmark } from '../phones/checkmark';
import type { Phone } from '../phones/types';

type Load = { state: 'loading' } | { state: 'loaded'; phone: Phone } | { state: 'not-found' } | { state: 'failed' };

/**
 * React port of the phone-detail AngularJS component. Same markup and
 * classes. Render it with a `key` per phone so state resets between phones.
 */
export function PhoneDetail({ phoneId }: { phoneId: string }) {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [mainImageUrl, setMainImageUrl] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    fetchPhone(phoneId, controller.signal).then(
      (phone) => {
        setLoad({ state: 'loaded', phone });
        setMainImageUrl(phone.images[0]);
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setLoad({ state: error instanceof PhoneApiError && error.status === 404 ? 'not-found' : 'failed' });
      },
    );
    return () => controller.abort();
  }, [phoneId]);

  if (load.state === 'loading') return null;
  if (load.state === 'not-found') return <p role="alert">Sorry, we could not find that phone.</p>;
  if (load.state === 'failed') return <p role="alert">Sorry, we could not load this phone. Please try again later.</p>;

  const { phone } = load;
  return (
    <>
      <div className="phone-images">
        <img src={mainImageUrl && assetUrl(mainImageUrl)} className="phone selected" />
      </div>

      <h1>{phone.name}</h1>

      <p>{phone.description}</p>

      <ul className="phone-thumbs">
        {phone.images.map((img) => (
          <li key={img}>
            <img src={assetUrl(img)} onClick={() => setMainImageUrl(img)} />
          </li>
        ))}
      </ul>

      <ul className="specs">
        <li>
          <span>Availability and Networks</span>
          <dl>
            <dt>Availability</dt>
            {phone.availability.map((availability) => (
              <dd key={availability}>{availability}</dd>
            ))}
          </dl>
        </li>
        <li>
          <span>Battery</span>
          <dl>
            <dt>Type</dt>
            <dd>{phone.battery.type}</dd>
            <dt>Talk Time</dt>
            <dd>{phone.battery.talkTime}</dd>
            <dt>Standby time (max)</dt>
            <dd>{phone.battery.standbyTime}</dd>
          </dl>
        </li>
        <li>
          <span>Storage and Memory</span>
          <dl>
            <dt>RAM</dt>
            <dd>{phone.storage.ram}</dd>
            <dt>Internal Storage</dt>
            <dd>{phone.storage.flash}</dd>
          </dl>
        </li>
        <li>
          <span>Connectivity</span>
          <dl>
            <dt>Network Support</dt>
            <dd>{phone.connectivity.cell}</dd>
            <dt>WiFi</dt>
            <dd>{phone.connectivity.wifi}</dd>
            <dt>Bluetooth</dt>
            <dd>{phone.connectivity.bluetooth}</dd>
            <dt>Infrared</dt>
            <dd>{checkmark(phone.connectivity.infrared)}</dd>
            <dt>GPS</dt>
            <dd>{checkmark(phone.connectivity.gps)}</dd>
          </dl>
        </li>
        <li>
          <span>Android</span>
          <dl>
            <dt>OS Version</dt>
            <dd>{phone.android.os}</dd>
            <dt>UI</dt>
            <dd>{phone.android.ui}</dd>
          </dl>
        </li>
        <li>
          <span>Size and Weight</span>
          <dl>
            <dt>Dimensions</dt>
            {phone.sizeAndWeight.dimensions.map((dim) => (
              <dd key={dim}>{dim}</dd>
            ))}
            <dt>Weight</dt>
            <dd>{phone.sizeAndWeight.weight}</dd>
          </dl>
        </li>
        <li>
          <span>Display</span>
          <dl>
            <dt>Screen size</dt>
            <dd>{phone.display.screenSize}</dd>
            <dt>Screen resolution</dt>
            <dd>{phone.display.screenResolution}</dd>
            <dt>Touch screen</dt>
            <dd>{checkmark(phone.display.touchScreen)}</dd>
          </dl>
        </li>
        <li>
          <span>Hardware</span>
          <dl>
            <dt>CPU</dt>
            <dd>{phone.hardware.cpu}</dd>
            <dt>USB</dt>
            <dd>{phone.hardware.usb}</dd>
            <dt>Audio / headphone jack</dt>
            <dd>{phone.hardware.audioJack}</dd>
            <dt>FM Radio</dt>
            <dd>{checkmark(phone.hardware.fmRadio)}</dd>
            <dt>Accelerometer</dt>
            <dd>{checkmark(phone.hardware.accelerometer)}</dd>
          </dl>
        </li>
        <li>
          <span>Camera</span>
          <dl>
            <dt>Primary</dt>
            <dd>{phone.camera.primary}</dd>
            <dt>Features</dt>
            <dd>{phone.camera.features.join(', ')}</dd>
          </dl>
        </li>
        <li>
          <span>Additional Features</span>
          {/* Invalid HTML (a <dd> outside a <dl>) carried over from the original; fixed in step 5. */}
          <dd>{phone.additionalFeatures}</dd>
        </li>
      </ul>
    </>
  );
}
