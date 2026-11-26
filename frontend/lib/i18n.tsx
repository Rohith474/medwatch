'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'en' | 'ml';

const TRANSLATIONS: Record<string, { en: string; ml: string }> = {
  // Navbar
  nav_home: { en: 'Home', ml: 'ഹോം' },
  nav_verify: { en: 'Verify Drug', ml: 'മരുന്ന് പരിശോധിക്കുക' },
  nav_alerts: { en: 'Live Alerts', ml: 'തത്സമയ മുന്നറിയിപ്പുകൾ' },
  nav_regulations: { en: 'Regulations', ml: 'നിയമങ്ങൾ' },
  nav_report: { en: 'Report', ml: 'പരാതി നൽകുക' },
  nav_report_full: { en: 'Report Medicine', ml: 'മരുന്ന് പരാതി' },
  nav_check_med: { en: 'Check Medicine', ml: 'മരുന്ന് പരിശോധിക്കുക' },
  dept_name: { en: 'Kerala Drug Control Dept.', ml: 'കേരള ഡ്രഗ് കൺട്രോൾ വകുപ്പ്' },

  // Search Page
  search_badge: { en: 'Drug Verification Terminal', ml: 'മരുന്ന് ഗുണനിലവാര പരിശോധന' },
  search_title_1: { en: 'Verify Your', ml: 'നിങ്ങളുടെ മരുന്ന്' },
  search_title_2: { en: 'Medicine', ml: 'പരിശോധിക്കൂ' },
  search_subtitle: {
    en: "Enter the batch number from your medicine box. We'll check CDSCO and Kerala Drug Control databases instantly.",
    ml: 'മരുന്നിന്റെ സ്ട്രിപ്പിലുള്ള ബാച്ച് നമ്പർ നൽകുക. CDSCO, കേരള ഡ്രഗ് കൺട്രോൾ വിവരങ്ങൾ ഉടൻ പരിശോധിക്കാം.',
  },
  label_batch: { en: 'Batch Number', ml: 'ബാച്ച് നമ്പർ' },
  label_drug: { en: 'Drug Name', ml: 'മരുന്നിന്റെ പേര്' },
  btn_scan_camera: { en: 'Scan Barcode / QR Code with Camera', ml: 'ക്യാമറ വഴി QR / ബാർകോഡ് സ്കാൻ ചെയ്യുക' },
  btn_scan_sub: { en: 'Supports live camera & image file upload', ml: 'ലൈവ് ക്യാമറയും ഫോട്ടോ അപ്‌ലോഡും ലഭ്യമാണ്' },
  btn_verify_now: { en: 'Verify Medicine Now', ml: 'മരുന്ന് ഇപ്പോൾ പരിശോധിക്കുക' },
  btn_querying: { en: 'Querying databases...', ml: 'വിവരങ്ങൾ പരിശോധിക്കുന്നു...' },
  btn_report_this: { en: 'Report This Medicine', ml: 'ഈ മരുന്നിനെതിരെ പരാതി നൽകുക' },
  btn_print: { en: 'Print Result', ml: 'പ്രിന്റ് ചെയ്യുക' },
  btn_all_recalls: { en: 'View All Recalls', ml: 'എല്ലാ മുന്നറിയിപ്പുകളും' },

  // 6 Official Result Types
  res_NSQ_FOUND: { en: 'NSQ FOUND', ml: 'നിലവാരമില്ലാത്ത മരുന്ന് (NSQ)' },
  res_NSQ_SEV: {
    en: 'CRITICAL — Batch Failed Lab Quality Test. Do not use.',
    ml: 'അതീവ ജാഗ്രത — ലാബ് പരിശോധനയിൽ പരാജയപ്പെട്ട ബാച്ച്. ഉപയോഗിക്കരുത്.',
  },
  res_SPURIOUS_DRUG: { en: 'SPURIOUS DRUG', ml: 'വ്യാജ മരുന്ന് (SPURIOUS)' },
  res_SPURIOUS_SEV: {
    en: 'CRITICAL — Fake / Counterfeit Drug Identified. Report immediately.',
    ml: 'അതീവ ജാഗ്രത — വ്യാജ മരുന്നായി തിരിച്ചറിഞ്ഞു. ഉടൻ റിപ്പോർട്ട് ചെയ്യുക.',
  },
  res_ADULTERATED: { en: 'ADULTERATED', ml: 'മായം ചേർത്ത മരുന്ന്' },
  res_ADULTERATED_SEV: {
    en: 'CRITICAL — Drug Contains Harmful Substances. Stop use immediately.',
    ml: 'അതീവ ജാഗ്രത — അപകടകരമായ വസ്തുക്കൾ അടങ്ങിയിരിക്കുന്നു. ഉപയോഗം നിർത്തുക.',
  },
  res_MISBRANDED: { en: 'MISBRANDED', ml: 'തെറ്റായ ലേബൽ (MISBRANDED)' },
  res_MISBRANDED_SEV: {
    en: 'STANDARD — Incorrect Label or Identity. Do not use.',
    ml: 'ജാഗ്രത — തെറ്റായ ലേബലോ വിവരങ്ങളോ. ഉപയോഗിക്കരുത്.',
  },
  res_NO_ADVERSE_REPORT: { en: 'NO ADVERSE REPORT FOUND', ml: 'പ്രതികൂല റിപ്പോർട്ടുകളില്ല' },
  res_NO_ADVERSE_SEV: {
    en: 'ADVISORY — Not in any failed list. This is NOT a quality clearance.',
    ml: 'അറിയിപ്പ് — പരാജയപ്പെട്ട പട്ടികയിൽ ഇല്ല. ഇത് ഗുണനിലവാര സർട്ടിഫിക്കറ്റല്ല.',
  },
  res_DATA_UNAVAILABLE: { en: 'DATA UNAVAILABLE', ml: 'വിവരങ്ങൾ ലഭ്യമല്ല' },
  res_DATA_UNAVAILABLE_SEV: {
    en: 'Could not match — check your batch number and drug name.',
    ml: 'പൊരുത്തപ്പെടുന്ന വിവരങ്ങളില്ല — ബാച്ച് നമ്പറും പേരും പരിശോധിക്കുക.',
  },

  // Report Page
  rpt_badge: { en: 'Anonymous Citizen Reporting', ml: 'അജ്ഞാത പൗര പരാതി സംവിധാനം' },
  rpt_title_1: { en: 'Report Suspicious', ml: 'സംശയാസ്പദമായ മരുന്ന്' },
  rpt_title_2: { en: 'Medicine', ml: 'റിപ്പോർട്ട് ചെയ്യുക' },
  rpt_subtitle: {
    en: 'Spotted a suspected fake medicine, tampered strip, or experienced an adverse reaction? Report it anonymously to Kerala Drug Control Inspectors.',
    ml: 'വ്യാജ മരുന്നോ കേടുവന്ന സ്ട്രിപ്പോ പാർശ്വഫലങ്ങളോ കണ്ടാൽ കേരള ഡ്രഗ് കൺട്രോൾ ഇൻസ്പെക്ടർമാർക്ക് റിപ്പോർട്ട് ചെയ്യുക.',
  },
  rpt_track_title: { en: 'Already Reported? Track Your Report Status', ml: 'മുമ്പ് പരാതി നൽകിയോ? തൽസ്ഥിതി പരിശോധിക്കുക' },
  rpt_track_btn: { en: 'Track Status', ml: 'പരിശോധിക്കുക' },
  rpt_submit_btn: { en: 'Submit Anonymous Report to Drug Control', ml: 'ഡ്രഗ് കൺട്രോൾ വകുപ്പിന് പരാതി സമർപ്പിക്കുക' },
  rpt_safety_title: { en: 'Important Safety Notice for You', ml: 'നിങ്ങൾക്കുള്ള പ്രധാന സുരക്ഷാ നിർദ്ദേശം' },
  rpt_safety_1: { en: 'Stop using the medicine immediately.', ml: 'ഈ മരുന്ന് ഉപയോഗിക്കുന്നത് ഉടൻ നിർത്തുക.' },
  rpt_safety_2: {
    en: 'Keep the medicine strip/box and purchase bill safely (do not throw them away).',
    ml: 'മരുന്നിന്റെ സ്ട്രിപ്പും വാങ്ങിയ ബില്ലും സുരക്ഷിതമായി സൂക്ഷിക്കുക (കളയരുത്).',
  },
  rpt_safety_3: {
    en: 'Your Home is Private: Drug Inspectors only inspect the pharmacy/batch source — never your home.',
    ml: 'സ്വകാര്യത: ഇൻസ്പെക്ടർമാർ ഫാർമസിയും ബാച്ചും മാത്രമേ പരിശോധിക്കൂ — വീട്ടിൽ വരില്ല.',
  },

  // Homepage
  home_badge: { en: 'Live Drug Verification System', ml: 'തത്സമയ മരുന്ന് പരിശോധന സംവിധാനം' },
  home_hero_1: { en: 'Is Your Medicine', ml: 'നിങ്ങളുടെ മരുന്ന്' },
  home_hero_2: { en: 'Safe to Take?', ml: 'സുരക്ഷിതമാണോ?' },
  home_hero_sub: {
    en: 'Enter any medicine batch number to instantly verify if it has been flagged as NSQ, Spurious, or Adulterated by Kerala Drug Control & CDSCO.',
    ml: 'നിങ്ങളുടെ മരുന്ന് വ്യാജമാണോ, നിലവാരമില്ലാത്തതാണോ (NSQ), മായം ചേർത്തതാണോ എന്ന് ബാച്ച് നമ്പർ നൽകി ഉടൻ പരിശോധിക്കുക.',
  },
  home_quick: { en: 'Quick Verify', ml: 'വേഗത്തിൽ പരിശോധിക്കുക' },
  home_verify_btn: { en: 'Verify', ml: 'പരിശോധിക്കുക' },
  home_scan_box: { en: 'Scan Medicine Box', ml: 'മരുന്ന് ബോക്സ് സ്കാൻ ചെയ്യുക' },
  home_view_recalls: { en: 'View Active Recalls', ml: 'നിലവിലെ മുന്നറിയിപ്പുകൾ കാണുക' },
  home_stat_1: { en: 'Drug Batches Verified Today', ml: 'ഇന്ന് പരിശോധിച്ച ബാച്ചുകൾ' },
  home_stat_2: { en: 'NSQ Batches in Database', ml: 'നിലവാരമില്ലാത്ത ബാച്ചുകൾ' },
  home_stat_3: { en: 'Accredited Labs Connected', ml: 'അംഗീകൃത ലാബുകൾ' },
  home_stat_4: { en: 'Citizens Protected', ml: 'സുരക്ഷിതരായ പൗരന്മാർ' },
  home_how_title: { en: 'How It Works', ml: 'എങ്ങനെ പ്രവർത്തിക്കുന്നു' },
  home_how_sub: { en: 'Verify any medicine in 3 simple steps', ml: '3 ലളിതമായ ഘട്ടങ്ങളിലൂടെ മരുന്ന് പരിശോധിക്കാം' },
  home_step1_t: { en: 'Find the Batch Number', ml: 'ബാച്ച് നമ്പർ കണ്ടെത്തുക' },
  home_step1_d: {
    en: 'Look at the medicine box or strip. The Batch Number is printed next to the manufacturing date.',
    ml: 'മരുന്ന് സ്ട്രിപ്പിലോ ബോക്സിലോ നിർമ്മാണ തീയതിക്കൊപ്പം അച്ചടിച്ചിരിക്കുന്ന ബാച്ച് നമ്പർ നോക്കുക.',
  },
  home_step2_t: { en: 'Enter or Scan', ml: 'നൽകുക അല്ലെങ്കിൽ സ്കാൻ ചെയ്യുക' },
  home_step2_d: {
    en: 'Type the Batch Number + Drug Name in the search form, or scan the barcode / QR code on the box.',
    ml: 'ബാച്ച് നമ്പറും പേരും നൽകുക, അല്ലെങ്കിൽ ക്യാമറ ഉപയോഗിച്ച് QR / ബാർകോഡ് സ്കാൻ ചെയ്യുക.',
  },
  home_step3_t: { en: 'Get Instant Result', ml: 'ഉടൻ ഫലം ലഭിക്കുക' },
  home_step3_d: {
    en: 'MEDWATCH checks CDSCO and Kerala Drug Control databases and returns a verified safety status in seconds.',
    ml: 'CDSCO, കേരള ഡ്രഗ് കൺട്രോൾ വിവരങ്ങൾ പരിശോധിച്ച് നിമിഷങ്ങൾക്കകം സുരക്ഷാ വിവരം നൽകുന്നു.',
  },
  home_verify_cta: { en: 'Verify My Medicine Now', ml: 'എന്റെ മരുന്ന് ഇപ്പോൾ പരിശോധിക്കുക' },
  home_recent_title: { en: 'Recent Drug Alerts', ml: 'സമീപകാല മരുന്ന് മുന്നറിയിപ്പുകൾ' },
  home_recent_sub: {
    en: 'Latest batches flagged by Kerala Drug Control & CDSCO',
    ml: 'കേരള ഡ്രഗ് കൺട്രോളും CDSCO-യും തടഞ്ഞ ഏറ്റവും പുതിയ ബാച്ചുകൾ',
  },
  home_view_all: { en: 'View All →', ml: 'എല്ലാം കാണുക →' },
  home_res_title: { en: 'Understanding Your Results', ml: 'പരിശോധനാ ഫലങ്ങൾ മനസ്സിലാക്കാം' },
  home_res_sub: {
    en: 'MEDWATCH never shows "PASS". Absence of a record means no adverse report — not a quality clearance.',
    ml: 'MEDWATCH ഒരിക്കലും "PASS" എന്ന് കാണിക്കില്ല. റിപ്പോർട്ട് ഇല്ല എന്നത് ഗുണനിലവാര സർട്ടിഫിക്കറ്റല്ല.',
  },
  home_cta_title: { en: "Don't Risk Your Health", ml: 'ആരോഗ്യം പണയം വെക്കരുത്' },
  home_cta_sub: {
    en: 'Always verify your medicine before use. It takes 3 seconds and could save your life.',
    ml: 'ഉപയോഗിക്കുന്നതിന് മുമ്പ് മരുന്ന് പരിശോധിക്കുക. ഇതിന് 3 സെക്കൻഡ് മാത്രമേ എടുക്കൂ.',
  },
  home_cta_btn: { en: "Verify Medicine Now — It's Free", ml: 'ഇപ്പോൾ സൗജന്യമായി പരിശോധിക്കുക' },

  // Alerts Page
  alerts_badge: { en: 'Live Drug Recall Alerts', ml: 'തത്സമയ മരുന്ന് പിൻവലിക്കൽ മുന്നറിയിപ്പുകൾ' },
  alerts_title: { en: 'Active Drug Recalls', ml: 'നിലവിലെ മരുന്ന് മുന്നറിയിപ്പുകൾ' },
  alerts_sub: {
    en: 'Live alerts from Kerala Drug Control Department and CDSCO. If your medicine appears here — stop use immediately and contact your pharmacist.',
    ml: 'കേരള ഡ്രഗ് കൺട്രോളിൽ നിന്നും CDSCO-യിൽ നിന്നുമുള്ള തത്സമയ മുന്നറിയിപ്പുകൾ. നിങ്ങളുടെ മരുന്ന് ഇതിലുണ്ടെങ്കിൽ ഉപയോഗം ഉടൻ നിർത്തുക.',
  },
  alerts_critical_lbl: { en: 'Critical Alerts', ml: 'അതീവ ജാഗ്രത' },
  alerts_standard_lbl: { en: 'Standard Alerts', ml: 'സാധാരണ മുന്നറിയിപ്പുകൾ' },
  alerts_advisory_lbl: { en: 'Advisories', ml: 'അറിയിപ്പുകൾ' },
  alerts_crit_sec: { en: 'Critical Recalls — Immediate Action Required', ml: 'അതീവ ജാഗ്രത — ഉടൻ നടപടി ആവശ്യമാണ്' },

  // Regulations Page
  reg_title: { en: 'Drug Regulations & Gazette', ml: 'മരുന്ന് നിയമങ്ങളും ഗസറ്റ് അറിയിപ്പുകളും' },
  reg_sub: {
    en: 'Official regulations, acts, and circulars governing drug quality in India and Kerala. Published by CDSCO and Kerala Drug Control Department.',
    ml: 'ഇന്ത്യയിലും കേരളത്തിലും മരുന്ന് ഗുണനിലവാരം നിയന്ത്രിക്കുന്ന ഔദ്യോഗിക നിയമങ്ങളും സർക്കുലറുകളും.',
  },
  reg_masthead: { en: 'The Kerala Government Gazette', ml: 'കേരള സർക്കാർ ഗസറ്റ്' },
  reg_official: { en: 'Official Drug Control Notifications', ml: 'ഔദ്യോഗിക ഡ്രഗ് കൺട്രോൾ വിജ്ഞാപനങ്ങൾ' },

  // Report Form Fields
  rpt_q1: { en: '1. What issue did you notice? *', ml: '1. എന്താണ് നിങ്ങൾ കണ്ട പ്രശ്നം? *' },
  rpt_opt_fake: { en: 'Suspected Fake / Spurious', ml: 'വ്യാജ മരുന്ന് സംശയം' },
  rpt_opt_fake_d: { en: 'Looks counterfeit, misspelled, or not listed', ml: 'വ്യാജമാണെന്ന് സംശയം അല്ലെങ്കിൽ അക്ഷരത്തെറ്റ്' },
  rpt_opt_adv: { en: 'Adverse Side Effect', ml: 'പാർശ്വഫലങ്ങൾ' },
  rpt_opt_adv_d: { en: 'Unexpected reaction after taking medicine', ml: 'മരുന്ന് കഴിച്ചതിനുശേഷമുള്ള അസ്വസ്ഥത' },
  rpt_opt_tamp: { en: 'Tampered Seal / Label', ml: 'സീൽ പൊട്ടിയതോ ലേബൽ മാറ്റിയതോ' },
  rpt_opt_tamp_d: { en: 'Broken seal, scratched batch, or altered expiry', ml: 'സീൽ പൊട്ടിയത് അല്ലെങ്കിൽ കാലാവധി മാറ്റിയത്' },
  rpt_opt_qual: { en: 'Spoiled / Quality Defect', ml: 'ഗുണനിലവാര തകരാറ്' },
  rpt_opt_qual_d: { en: 'Discolored tablets, foul smell, or broken strip', ml: 'നിറം മാറ്റം, ദുർഗന്ധം അല്ലെങ്കിൽ പൊട്ടിയ ഗുളിക' },
  rpt_lbl_drug: { en: 'Medicine / Brand Name *', ml: 'മരുന്നിന്റെ പേര് *' },
  rpt_lbl_batch: { en: 'Batch Number (if visible)', ml: 'ബാച്ച് നമ്പർ (കാണുന്നുണ്ടെങ്കിൽ)' },
  rpt_lbl_mfr: { en: 'Manufacturer (Optional)', ml: 'നിർമ്മാതാവ് (നിർബന്ധമില്ല)' },
  rpt_lbl_dist: { en: 'District', ml: 'ജില്ല' },
  rpt_lbl_shop: { en: 'Pharmacy / Medical Shop Name & Area (Optional)', ml: 'മെഡിക്കൽ ഷോപ്പിന്റെ പേരും സ്ഥലവും (നിർബന്ധമില്ല)' },
  rpt_lbl_desc: { en: 'Describe What Happened *', ml: 'വിശദവിവരം നൽകുക *' },
  rpt_lbl_contact: {
    en: 'Optional Contact (Leave blank for 100% Anonymous Reporting)',
    ml: 'ഫോൺ / ഇമെയിൽ (നിർബന്ധമില്ല — പൂർണ്ണമായും രഹസ്യമായിരിക്കും)',
  },
  rpt_success_title: { en: 'Report Submitted Successfully', ml: 'പരാതി വിജയകരമായി സമർപ്പിച്ചു' },
  rpt_ref_lbl: { en: 'Reference Number', ml: 'റഫറൻസ് നമ്പർ' },
  rpt_another: { en: 'Submit Another Report', ml: 'മറ്റൊരു പരാതി നൽകുക' },
  rpt_back: { en: '← Back to Verification', ml: '← പരിശോധനയിലേക്ക് മടങ്ങുക' },
};

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => TRANSLATIONS[key]?.en ?? key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('medwatch_lang');
    if (saved === 'ml' || saved === 'en') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('medwatch_lang', l);
    }
  };

  const toggleLang = () => setLang(lang === 'en' ? 'ml' : 'en');
  const t = (key: string) => TRANSLATIONS[key]?.[lang] ?? TRANSLATIONS[key]?.en ?? key;

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function T({ k }: { k: string }) {
  const { t } = useLang();
  return <>{t(k)}</>;
}
