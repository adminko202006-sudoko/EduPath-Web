import { useCallback, useEffect, useRef, useState } from 'react';
import { getLocations } from '../../services/locations';
import SearchableLocation, { addressInputClass } from './SearchableLocation';

export default function RegistrationAddress({ onChange, disabled }) {
  const [parts, setParts] = useState({ country: { id: 'PH', name: 'Philippines' }, province: null, city: null, street: '', provinceText: '', cityText: '' });
  const [provinces, setProvinces] = useState(null);
  const [provinceError, setProvinceError] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    let active = true;
    getLocations('countries/PH/provinces').then((rows) => { if (active) setProvinces(rows); })
      .catch(() => { if (active) setProvinceError(true); });
    return () => { active = false; };
  }, []);
  const provinceList = useCallback(() => Promise.resolve(provinces ?? []), [provinces]);
  const cityList = useCallback(() => getLocations(`countries/${parts.country.id}/cities${parts.province?.id && parts.province.id !== '__other__' ? `?province_id=${parts.province.id}` : ''}`), [parts.country, parts.province]);
  const manualProvince = parts.province?.id === '__other__';
  const noProvinces = provinces?.length === 0;
  const manualCity = manualProvince || parts.city?.id === '__other__';
  const provinceLabel = parts.country?.id === 'PH' ? 'Province/region' : 'Province/state';

  const update = (next) => {
    setParts(next);
    const province = next.province?.id === '__other__' || !next.province ? next.provinceText : next.province.name;
    const city = next.province?.id === '__other__' || next.city?.id === '__other__' || !next.city ? next.cityText : next.city.name;
    const components = {
      country_code: next.country?.id ?? '',
      province_id: next.province && next.province.id !== '__other__' ? next.province.id : null,
      city_id: next.city && next.city.id !== '__other__' ? next.city.id : null,
      province, city, street: next.street.trim(),
    };
    onChange({ address: [components.street, city, province, next.country?.name].filter(Boolean).join(', '), address_components: components });
  };

  const loadProvinces = async (country) => {
    const current = ++generation.current;
    setProvinces(null); setProvinceError(false);
    try {
      const rows = await getLocations(`countries/${country.id}/provinces`);
      if (generation.current === current) setProvinces(rows);
    } catch { if (generation.current === current) setProvinceError(true); }
  };

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-4 md:col-span-2">
      <legend className="mb-3 text-sm font-bold text-gray-800 dark:text-white">Complete address</legend>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Country<input value="Philippines" readOnly className={`${addressInputClass} mt-2`} /><span className="mt-1 block text-xs font-normal">Registration accepts Philippine addresses only.</span></label>
        {noProvinces ? <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Province/state (optional)<input className={`${addressInputClass} mt-2`} value={parts.provinceText} maxLength={150} onChange={(event) => update({ ...parts, provinceText: event.target.value })} autoComplete="address-level1" /></label>
          : <SearchableLocation key={parts.country?.id ?? 'province'} id="address-province" label={provinceLabel} value={parts.province} load={provinceList} manual disabled={disabled || !provinces} onChange={(province) => update({ ...parts, province, city: null, provinceText: '', cityText: '' })} />}
        {manualProvince && <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Enter province/state<input required maxLength={150} value={parts.provinceText} className={`${addressInputClass} mt-2`} onChange={(event) => update({ ...parts, provinceText: event.target.value })} autoComplete="address-level1" /></label>}
        {manualCity ? <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Enter city/municipality<input required maxLength={150} className={`${addressInputClass} mt-2`} value={parts.cityText} onChange={(event) => update({ ...parts, cityText: event.target.value })} autoComplete="address-level2" />{!manualProvince && <button type="button" className="mt-1 text-xs underline" onClick={() => update({ ...parts, city: null, cityText: '' })}>Choose from list</button>}</label>
          : <SearchableLocation key={`${parts.country?.id}-${parts.province?.id}`} id="address-city" label="City/municipality" value={parts.city} load={cityList} manual disabled={disabled || !parts.country || !provinces || (!noProvinces && !parts.province)} onChange={(city) => update({ ...parts, city, cityText: '' })} />}
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Household/house no., street and barangay<input required maxLength={200} value={parts.street} onChange={(event) => update({ ...parts, street: event.target.value })} placeholder="e.g. 24 Rizal Street, Poblacion" autoComplete="street-address" className={`${addressInputClass} mt-2`} /></label>
      </div>
      {parts.country && !provinces && !provinceError && <p role="status" className="text-sm text-gray-500 dark:text-gray-300">Loading provinces...</p>}
      {provinceError && <p role="alert" className="text-sm text-red-600 dark:text-red-300">Could not load provinces. <button type="button" className="font-semibold underline" onClick={() => loadProvinces(parts.country)}>Retry</button></p>}
      <p className="text-xs text-gray-500 dark:text-gray-400">Search each list, then enter your household/street details. {parts.country?.id === 'PH' && 'For cities outside a province, select their region. '}Location data: <a href="https://github.com/dr5hn/countries-states-cities-database" target="_blank" rel="noreferrer" className="underline">Countries States Cities</a> / <a href="https://github.com/alkevintan/psgc-rb" target="_blank" rel="noreferrer" className="underline">PSA-derived PSGC</a>.</p>
    </fieldset>
  );
}
