import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckoutSummaryCard } from '../components/CheckoutSummaryCard';
import {
  checkoutHasPmrProof,
  checkoutRequiresPmrProof,
  type EventCheckoutState,
  type PmrPreBookingAnswers,
} from '../lib/checkoutState';
import { persistCheckoutBasket, resolveEventCheckoutState } from '../lib/checkoutFlowStorage';
import { checkoutPath, connectPath, guestCheckoutPath, planPath } from '../lib/routes';
import '../CheckoutPage.css';
import '../GuestCheckoutPage.css';
import './PmrPreBookingPage.css';

const CHOICE = 'Votre choix';

const GENDER_OPTIONS = ['Homme', 'Femme', 'Non binaire', 'Préfère ne pas dire'];
const COUNTRY_OPTIONS = ['Belgique', 'France', 'Luxembourg', 'Pays-Bas', 'Allemagne', 'Autre'];
const SITUATION_OPTIONS = [
  'Personne en fauteuil roulant',
  'Mobilité réduite (sans fauteuil)',
  'Handicap sensoriel',
  'Handicap invisible',
  'Blessure / limitation temporaire',
  'Autre',
];
const MOBILITY_OPTIONS = [
  'Fauteuil roulant manuel',
  'Fauteuil roulant électrique',
  'Canne / béquilles',
  'Aucun aide technique',
  'Autre',
];
const YES_NO_OPTIONS = ['Oui', 'Non'];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];
const YEARS = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));

const emptyAnswers = (): PmrPreBookingAnswers => ({
  gender: '',
  birthDay: '',
  birthMonth: '',
  birthYear: '',
  phoneCountryCode: '+32',
  phoneNational: '',
  country: '',
  city: '',
  postalCode: '',
  address: '',
  situation: '',
  mobilityAid: '',
  assistanceDog: '',
  specificNeeds: '',
  withAssociation: '',
});

export function PmrPreBookingPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const data = useMemo(
    () => (eventId ? resolveEventCheckoutState(eventId, location.state) : null),
    [eventId, location.state],
  );

  const [answers, setAnswers] = useState<PmrPreBookingAnswers>(
    () => data?.pmrAnswers ?? emptyAnswers(),
  );
  const [fileName, setFileName] = useState(data?.pmrProofFileName ?? '');

  if (!eventId || !data) {
    return <Navigate to={eventId ? planPath('tickets') : '/'} replace />;
  }

  if (!checkoutRequiresPmrProof(data)) {
    const next =
      data.guestCheckout && !data.guest
        ? guestCheckoutPath(eventId)
        : checkoutPath(eventId);
    return <Navigate to={next} replace state={data} />;
  }

  if (checkoutHasPmrProof(data)) {
    const next =
      data.guestCheckout && !data.guest
        ? guestCheckoutPath(eventId)
        : checkoutPath(eventId);
    return <Navigate to={next} replace state={data} />;
  }

  const summaryPayload = {
    eventTitle: data.eventTitle,
    eventImage: data.eventImage,
    venue: data.venue,
    dateLine: data.dateLine,
    lines: data.lines,
    subtotal: data.subtotal,
    serviceFee: data.serviceFee,
    total: data.total,
  };

  const setField = <K extends keyof PmrPreBookingAnswers>(key: K, value: PmrPreBookingAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const onContinue = (e: FormEvent) => {
    e.preventDefault();

    const next: EventCheckoutState = {
      ...data,
      pmrProofFileName: fileName.trim() || 'skipped',
      pmrAnswers: answers,
    };
    persistCheckoutBasket(eventId, next);

    if (next.guestCheckout && !next.guest) {
      navigate(guestCheckoutPath(eventId), { state: next });
      return;
    }
    navigate(checkoutPath(eventId), { state: next });
  };

  return (
    <div className="checkoutPage guestCheckoutPage pmrPreBookingPage">
      <div className="checkoutPage__shell">
        <Link className="checkoutPage__back" to={connectPath(eventId)} state={data}>
          <span className="checkoutPage__backArrow" aria-hidden>
            ←
          </span>
          Confirm and pay
        </Link>

        <div className="checkoutGrid">
          <section className="checkoutGrid__payment guestCheckoutPanel pmrPreBookingPanel">
            <h1 className="pmrPreBookingPanel__heading">Booking details</h1>

            <form className="pmrPreBookingForm" onSubmit={onContinue} noValidate>
              <div className="pmrPreBookingForm__fields">
                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor="pmr-gender">
                    Genre <span className="pmrPreBookingField__required">*</span>
                  </label>
                  <select
                    id="pmr-gender"
                    className="pmrPreBookingField__control"
                    value={answers.gender}
                    onChange={(e) => setField('gender', e.target.value)}
                  >
                    <option value="">{CHOICE}</option>
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <fieldset className="pmrPreBookingField pmrPreBookingField--dob">
                  <legend className="pmrPreBookingField__label">
                    Date de naissance <span className="pmrPreBookingField__required">*</span>
                  </legend>
                  <div className="pmrPreBookingDob">
                    <select
                      aria-label="Jour"
                      className="pmrPreBookingField__control"
                      value={answers.birthDay}
                      onChange={(e) => setField('birthDay', e.target.value)}
                    >
                      <option value="">Jour</option>
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Mois"
                      className="pmrPreBookingField__control"
                      value={answers.birthMonth}
                      onChange={(e) => setField('birthMonth', e.target.value)}
                    >
                      <option value="">Mois</option>
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Année"
                      className="pmrPreBookingField__control"
                      value={answers.birthYear}
                      onChange={(e) => setField('birthYear', e.target.value)}
                    >
                      <option value="">Année</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </fieldset>

                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor="pmr-phone">
                    Téléphone mobile <span className="pmrPreBookingField__required">*</span>
                  </label>
                  <div className="pmrPreBookingPhone">
                    <select
                      aria-label="Indicatif"
                      className="pmrPreBookingField__control pmrPreBookingPhone__code"
                      value={answers.phoneCountryCode}
                      onChange={(e) => setField('phoneCountryCode', e.target.value)}
                    >
                      <option value="+32">🇧🇪 +32</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+352">🇱🇺 +352</option>
                      <option value="+31">🇳🇱 +31</option>
                      <option value="+49">🇩🇪 +49</option>
                    </select>
                    <input
                      id="pmr-phone"
                      type="tel"
                      className="pmrPreBookingField__control"
                      value={answers.phoneNational}
                      onChange={(e) => setField('phoneNational', e.target.value)}
                      placeholder="Numéro"
                      autoComplete="tel-national"
                    />
                  </div>
                </div>

                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor="pmr-country">
                    Pays <span className="pmrPreBookingField__required">*</span>
                  </label>
                  <select
                    id="pmr-country"
                    className="pmrPreBookingField__control"
                    value={answers.country}
                    onChange={(e) => setField('country', e.target.value)}
                  >
                    <option value="">{CHOICE}</option>
                    {COUNTRY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor="pmr-city">
                    Ville <span className="pmrPreBookingField__required">*</span>
                  </label>
                  <input
                    id="pmr-city"
                    type="text"
                    className="pmrPreBookingField__control"
                    value={answers.city}
                    onChange={(e) => setField('city', e.target.value)}
                    autoComplete="address-level2"
                  />
                </div>

                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor="pmr-postal">
                    Code postal <span className="pmrPreBookingField__required">*</span>
                  </label>
                  <input
                    id="pmr-postal"
                    type="text"
                    className="pmrPreBookingField__control"
                    value={answers.postalCode}
                    onChange={(e) => setField('postalCode', e.target.value)}
                    autoComplete="postal-code"
                  />
                </div>

                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor="pmr-address">
                    Adresse <span className="pmrPreBookingField__required">*</span>
                  </label>
                  <input
                    id="pmr-address"
                    type="text"
                    className="pmrPreBookingField__control"
                    value={answers.address}
                    onChange={(e) => setField('address', e.target.value)}
                    autoComplete="street-address"
                  />
                </div>

                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor="pmr-situation">
                    Quelle est votre situation ?{' '}
                    <span className="pmrPreBookingField__required">*</span>
                  </label>
                  <select
                    id="pmr-situation"
                    className="pmrPreBookingField__control"
                    value={answers.situation}
                    onChange={(e) => setField('situation', e.target.value)}
                  >
                    <option value="">{CHOICE}</option>
                    {SITUATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor="pmr-mobility">
                    Pour vos déplacements, vous utilisez principalement...{' '}
                    <span className="pmrPreBookingField__required">*</span>
                  </label>
                  <select
                    id="pmr-mobility"
                    className="pmrPreBookingField__control"
                    value={answers.mobilityAid}
                    onChange={(e) => setField('mobilityAid', e.target.value)}
                  >
                    <option value="">{CHOICE}</option>
                    {MOBILITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor="pmr-dog">
                    Êtes-vous accompagné d&apos;un chien d&apos;assistance ?{' '}
                    <span className="pmrPreBookingField__required">*</span>
                  </label>
                  <select
                    id="pmr-dog"
                    className="pmrPreBookingField__control"
                    value={answers.assistanceDog}
                    onChange={(e) => setField('assistanceDog', e.target.value)}
                  >
                    <option value="">{CHOICE}</option>
                    {YES_NO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor="pmr-needs">
                    Souhaitez-vous préciser votre situation, votre pathologie ou des besoins
                    spécifiques (espace pour fauteuil, accompagnant...) ?
                  </label>
                  <textarea
                    id="pmr-needs"
                    className="pmrPreBookingField__control pmrPreBookingField__textarea"
                    rows={4}
                    value={answers.specificNeeds}
                    onChange={(e) => setField('specificNeeds', e.target.value)}
                  />
                </div>

                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor="pmr-association">
                    Viendrez-vous avec une association ou un centre spécialisé ?{' '}
                    <span className="pmrPreBookingField__required">*</span>
                  </label>
                  <select
                    id="pmr-association"
                    className="pmrPreBookingField__control"
                    value={answers.withAssociation}
                    onChange={(e) => setField('withAssociation', e.target.value)}
                  >
                    <option value="">{CHOICE}</option>
                    {YES_NO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pmrPreBookingField">
                  <label className="pmrPreBookingField__label" htmlFor={fileInputId}>
                    Merci de déposer ici votre justificatif (carte d&apos;invalidité, certificat
                    médical...) <span className="pmrPreBookingField__required">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    id={fileInputId}
                    type="file"
                    className="pmrPreBookingField__fileInput"
                    accept="image/*,.pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
                  />
                  <button
                    type="button"
                    className={`pmrPreBookingField__dropzone${fileName ? ' pmrPreBookingField__dropzone--filled' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {fileName ? fileName : 'Choisissez votre fichier'}
                  </button>
                </div>
              </div>

              <div className="pmrPreBookingForm__cta">
                <button
                  type="submit"
                  className="pmrPreBookingContinue"
                >
                  Continue
                </button>
              </div>
            </form>
          </section>

          <aside className="checkoutGrid__summary" aria-label="Order summary">
            <div className="pmrPreBookingSummarySticky">
              <CheckoutSummaryCard data={summaryPayload} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
