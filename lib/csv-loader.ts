import Papa from 'papaparse';
import {
  CoreHREmployee,
  PayrollRecord,
  LearningRecord,
  AccessDirectoryRecord
} from './types';

// Fallback embedded strings in case running in browser or serverless
export const rawCoreHrCSV = `emp_id,national_id,first_name,last_name,display_name,email,gender,date_of_birth,hire_date,employment_status,termination_date,business_unit,department,job_title,work_location,cost_center,manager_emp_id
EK-10142,784-1982-1492019-1,Tariq,Al-Mansoor,Capt. Tariq Al-Mansoor,tariq.almansoor@emirates.com,Male,1982-04-12,2011-03-15,Active,,Emirates Airline,Flight Operations,Captain - Boeing 777,DXB Headquarters,EK-FLTOP-101,EK-10001
EK-10255,784-1988-2938172-4,Sarah,Jenkins,Sarah Jenkins,sarah.jenkins@emirates.com,Female,1988-09-22,2016-07-01,Active,,Emirates Airline,Flight Operations,First Officer - Airbus A380,DXB Terminal 3,EK-FLTOP-102,EK-10142
EK-10389,784-1979-9948210-3,Mohammed,Al-Hashimi,Mohammed Al-Hashimi,mohammed.alhashimi@emirates.com,Male,1979-11-03,2008-01-10,Active,,Emirates Engineering,Base Maintenance,Senior Licensed Aircraft Engineer (B1/B2),DXB Engineering Centre,EK-ENG-501,EK-10020
EK-10492,784-1991-3829104-7,Elena,Rostova,Elena Rostova,elena.rostova@emirates.com,Female,1991-02-18,2017-09-12,Active,,Emirates Airline,Inflight Services,Senior Cabin Crew Purser,DXB HQ / Crew Briefing,EK-INFLT-204,EK-10110
EK-10511,784-1985-7182930-2,Rashid,Al-Maktoum,Rashid Al-Maktoum,rashid.almaktoum@emirates.com,Male,1985-06-30,2013-11-01,Terminated,2026-09-30,Group Corporate,Information Technology,Lead Cloud Security Architect,Emirates Group HQ - Al Garhoud,EK-GIT-301,EK-10005
EK-10640,784-1994-4482910-8,Fatima,Zahra,Fatima Zahra,fatima.zahra@emirates.com,Female,1994-12-05,2020-02-01,Active,,Group Corporate,Finance & Treasury,Senior Financial Analyst,Emirates Group HQ,EK-FIN-402,EK-10012
DN-20104,784-1987-5519203-9,Rajesh,Nambiar,Rajesh Nambiar,rajesh.nambiar@dnata.com,Male,1987-08-14,2014-05-20,Active,,dnata,Airport Operations,Ramp Operations Supervisor,DXB Cargo Mega Terminal,DN-RAMP-102,DN-20002
DN-20219,784-1992-8827361-5,Ahmed,Al-Falasi,Ahmed Al-Falasi,ahmed.alfalasi@dnata.com,Male,1992-03-25,2018-10-15,Terminated,2026-10-01,dnata,Cargo Operations,Airside Dangerous Goods Officer,DXB Cargo Mega Terminal,DN-CARGO-201,DN-20104
DN-20350,784-1990-1129384-6,Grace,O'Connor,Grace O'Connor,grace.oconnor@dnata.com,Female,1990-07-19,2019-04-10,Active,,dnata,Ground Support,Fleet Dispatch Lead,DWC Al Maktoum Airport,DN-OPS-303,DN-20002
EK-10788,784-1983-6627194-0,Marcus,Vanderbilt,Capt. Marcus Vanderbilt,marcus.vanderbilt@emirates.com,Male,1983-01-29,2012-08-01,Active,,Emirates Airline,Flight Operations,Captain - Airbus A380,DXB Terminal 3,EK-FLTOP-102,EK-10001
EK-10899,784-1993-9018274-1,Priya,Sharma,Priya Sharma,priya.sharma@emirates.com,Female,1993-10-11,2021-06-15,Active,,Emirates Airline,Inflight Services,Flight Stewardess,DXB Crew Briefing,EK-INFLT-204,EK-10492
EK-10950,784-1989-3329182-3,Khaled,Al-Nuaimi,Khaled Al-Nuaimi,khaled.alnuaimi@emirates.com,Male,1989-05-14,2015-02-01,Active,,Emirates Engineering,Avionics & Line Maintenance,Avionics Systems Specialist,DXB Engineering Centre,EK-ENG-502,EK-10389
EK-11022,784-1986-7729104-5,Carlos,Mendez,Carlos Mendez,carlos.mendez@emirates.com,Male,1986-11-08,2014-09-01,Active,,Emirates Airline,Flight Operations,Senior First Officer - Boeing 777,DXB Headquarters,EK-FLTOP-101,EK-10142
EK-11105,784-1995-1284920-6,Amina,Bello,Amina Bello,amina.bello@emirates.com,Female,1995-04-17,2022-01-10,Active,,Group Corporate,Human Resources,People Operations Specialist,Emirates Group HQ,EK-HR-101,EK-10008
DN-20488,784-1984-9918273-4,Hassan,Al-Balooshi,Hassan Al-Balooshi,hassan.albalooshi@dnata.com,Male,1984-12-02,2010-11-15,Active,,dnata,Catering Services,Executive Flight Catering Lead,DXB Flight Kitchen 1,DN-CAT-401,DN-20005`;

export const rawPayrollCSV = `payroll_id,emp_code,national_id_hash,account_holder_name,bank_name,iban,base_salary,currency,flight_allowance,housing_allowance,cost_center_code,payment_status,last_processed_date
PR-88101,EK-10142,784-1982-1492019-1,Tareq Al Mansoor,Emirates NBD,AE240260000101428810101,58000,AED,16500,12000,EK-FLTOP-102,Active,2026-09-28
PR-88102,EK-10255,784-1988-2938172-4,Sarah Jenkins,Dubai Islamic Bank,AE440240000102558810202,38000,USD,11200,9500,EK-FLTOP-102,Active,2026-09-28
PR-88103,EK-10389,784-1979-9948210-3,Mohamed Al Hashmi,Abu Dhabi Commercial Bank,AE030030000103898810303,42000,AED,0,10500,EK-ENG-501,Active,2026-09-28
PR-88104,EK-10492,784-1991-3829104-7,Elena Rostova,Mashreq Bank,AE710330000104928810404,18500,AED,5800,6000,EK-INFLT-204,Active,2026-09-28
PR-88105,EK-10511,784-1985-7182930-2,Rashid Al-Maktoum,Emirates NBD,AE240260000105118810505,46000,AED,0,11000,EK-GIT-301,Active,2026-09-28
PR-88106,EK-10640,784-1994-4482910-8,Fatima Zahra,First Abu Dhabi Bank,AE190030000106408810606,28000,AED,0,7500,EK-FIN-402,Active,2026-09-28
PR-88201,DN-20104,784-1987-5519203-9,Rajesh Nambiar,Standard Chartered UAE,AE920110000201048820101,16500,AED,0,5000,EK-ENG-501,Active,2026-09-28
PR-88202,DN-20219,784-1992-8827361-5,Ahmed Al-Falasi,Emirates Islamic,AE550440000202198820202,15000,AED,0,4500,DN-CARGO-201,Suspended,2026-09-28
PR-88203,DN-20350,784-1990-1129384-6,Grace O'Connor,Dubai Islamic Bank,AE440240000203508820303,17200,AED,0,5200,DN-OPS-303,Active,2026-09-28
PR-88107,EK-10788,784-1983-6627194-0,Marcus Vanderbilt,HSBC Middle East,AE880200000107888810707,62000,AED,18000,13500,EK-FLTOP-102,Active,2026-09-28
PR-88108,EK-10899,784-1993-9018274-1,Priya Sharma,Commercial Bank of Dubai,AE660150000108998810808,12500,AED,4200,4500,EK-INFLT-204,Active,2026-09-28
PR-88109,EK-10950,784-1989-3329182-3,Khaled Al-Nuaimi,Emirates NBD,AE240260000109508810909,31000,AED,0,8000,EK-ENG-502,Active,2026-09-28
PR-88110,EK-11022,784-1986-7729104-5,Carlos Mendez,First Abu Dhabi Bank,AE190030000110228811010,41000,AED,12800,10000,EK-FLTOP-101,Active,2026-09-28
PR-88111,EK-11105,784-1995-1284920-6,Amina Bello,Abu Dhabi Islamic Bank,AE330500000111058811111,19500,AED,0,5500,EK-HR-101,Active,2026-09-28
PR-88204,DN-20488,784-1984-9918273-4,Hassan Al-Balooshi,Emirates NBD,AE240260000204888820404,22000,AED,0,6500,DN-CAT-401,Active,2026-09-28
PR-88999,DN-99801,784-1981-6677889-0,Vikramaditya Rao,Mashreq Bank,AE710330000998018899999,24500,AED,0,6500,DN-CARGO-201,Active,2026-09-28`;

export const rawLearningCSV = `certification_id,staff_number,attendee_name,course_code,course_name,issuing_authority,completion_date,valid_until,compliance_status,score_pct,renewal_required
CERT-7701,EK-10142,Tariq Al-Mansoor,GCAA-B777-LPC,Boeing 777 Line Proficiency & Recurrent Sim Check,UAE GCAA,2025-09-15,2026-09-15,Expired,94,true
CERT-7702,EK-10142,Tariq Al-Mansoor,GCAA-MED-CL1,GCAA Class 1 Flight Crew Medical Certification,UAE GCAA Aeromedical,2026-02-10,2027-02-10,Valid,100,false
CERT-3801,EK-10255,Sarah Jenkins,GCAA-A380-LPC,Airbus A380 Recurrent Simulator Proficiency Check,UAE GCAA,2026-04-12,2027-04-12,Valid,98,false
CERT-3802,EK-10255,Sarah Jenkins,GCAA-MED-CL1,GCAA Class 1 Flight Crew Medical Certification,UAE GCAA Aeromedical,2026-05-18,2027-05-18,Valid,100,false
CERT-5001,EK-10389,Mohammed Al-Hashimi,EASA-P145-EWIS,EASA/GCAA Part-145 EWIS & Fuel Tank Safety Phase 2,EASA / UAE GCAA,2024-08-30,2026-08-30,Expired,91,true
CERT-5002,EK-10389,Mohammed Al-Hashimi,GCAA-P66-AV,GCAA Part-66 Aircraft Maintenance Engineer License Recurrent,UAE GCAA,2025-11-20,2027-11-20,Valid,96,false
CERT-2041,EK-10492,Elena Rostova,EK-SEP-ANNUAL,Annual Safety & Emergency Procedures (A380/B777),Emirates Aviation College,2026-01-15,2027-01-15,Valid,99,false
CERT-3011,EK-10511,Rashid Al-Maktoum,EK-SEC-AWARE,Group Cyber Defense & Data Privacy Refresher,Emirates Group IT,2026-03-01,2027-03-01,Valid,100,false
CERT-4021,EK-10640,Fatima Zahra,IFRS-FIN-REP,IFRS & International Financial Reporting Standards,Emirates Finance,2025-12-10,2027-12-10,Valid,95,false
CERT-8801,DN-20104,Rajesh Nambiar,DN-ADP-CAT3,DXB Airside Driving Permit - Category 3 (Heavy Ramp),Dubai Airports Authority,2024-10-26,2026-10-26,Expiring_Soon,92,true
CERT-8802,DN-20104,Rajesh Nambiar,IATA-DGR-CAT8,IATA Dangerous Goods Acceptance & Ramp Handling,IATA Training,2025-06-14,2027-06-14,Valid,95,false
CERT-8901,DN-20219,Ahmed Al-Falasi,IATA-DGR-CAT6,IATA Dangerous Goods Regulations - Cat 6 Certification,IATA Training,2024-04-10,2026-04-10,Expired,88,true
CERT-9101,DN-20350,Grace O'Connor,DWC-RAMP-SAFETY,DWC Al Maktoum Ground Operations Safety Matrix,dnata Safety,2026-02-14,2027-02-14,Valid,97,false
CERT-3803,EK-10788,Marcus Vanderbilt,GCAA-A380-LPC,Airbus A380 Line Proficiency & Command Recurrent,UAE GCAA,2026-03-20,2027-03-20,Valid,99,false
CERT-2042,EK-10899,Priya Sharma,EK-SEP-ANNUAL,Annual Safety & Emergency Procedures (A380/B777),Emirates Aviation College,2026-02-10,2027-02-10,Valid,97,false
CERT-5003,EK-10950,Khaled Al-Nuaimi,GCAA-AV-RADAR,Aircraft Weather Radar & TCAS Maintenance Certification,UAE GCAA,2025-08-15,2027-08-15,Valid,94,false
CERT-7703,EK-11022,Carlos Mendez,GCAA-B777-LPC,Boeing 777 Line Proficiency Check,UAE GCAA,2026-06-18,2027-06-18,Valid,96,false
CERT-1011,EK-11105,Amina Bello,CIPD-HR-TALENT,CIPD Strategic People Management & UAE Labour Law,CIPD Middle East,2025-10-01,2027-10-01,Valid,93,false
CERT-4011,DN-20488,Hassan Al-Balooshi,HACCP-AIR-CAT,HACCP Level 4 Inflight Catering Food Safety Certification,Dubai Municipality Food Safety,2026-01-20,2028-01-20,Valid,98,false`;

export const rawAccessDirectoryCSV = `user_principal_name,employee_reference,full_name,account_status,mfa_enforced,security_groups,badge_number,airside_security_clearance,badge_status,badge_expiration,last_logon_timestamp,last_badge_swipe_location
tariq.almansoor@emirates.com,EK-10142,Tariq Al-Mansoor,Active,true,"FlightOps-Pilots,B777-Crew-Access,DXB-Crew-Terminal",DXB-AIR-10142,Red Badge - Airside Flight Deck,Active,2027-04-30,2026-10-23T06:15:00Z,DXB Terminal 3 Crew Gate Bravo
sarah.jenkins@emirates.com,EK-10255,Sarah Jenkins,Active,true,"FlightOps-Pilots,A380-Crew-Access,DXB-Crew-Terminal",DXB-AIR-10255,Red Badge - Airside Flight Deck,Active,2027-08-15,2026-10-22T21:40:00Z,DXB Terminal 3 Crew Briefing Room 4
mohammed.alhashimi@emirates.com,EK-10389,Mohammed Al-Hashimi,Active,true,"Engineering-Staff,DXB-Hangar-Access,Avionics-Bay",DXB-AIR-10389,Red Badge - Engineering All Hangars,Active,2027-01-20,2026-10-23T07:10:00Z,Engineering Centre Gate 2 - Hangar 4
elena.rostova@emirates.com,EK-10492,Elena Rostova,Active,true,"CabinCrew-Pursers,Inflight-Services-Portal,DXB-Crew-Briefing",DXB-AIR-10492,Blue Badge - Terminal & Aircraft Cabins,Active,2027-09-30,2026-10-23T04:20:00Z,DXB Terminal 3 Briefing Room 8
rashid.almaktoum@emirates.com,EK-10511,Rashid Al-Maktoum,Active,true,"Global-Enterprise-Admins,Cloud-Sec-Root,VPN-Executive-Access,PAM-Vault-Auditors",DXB-HQ-10511,Green Badge - Landside HQ Only,Active,2027-06-30,2026-10-23T07:45:00Z,Emirates Group HQ Floor 4 Server Room
fatima.zahra@emirates.com,EK-10640,Fatima Zahra,Active,true,"Finance-SAP-Treasury,Oracle-ERP-Financials,Corporate-Staff",DXB-HQ-10640,Green Badge - Landside HQ Only,Active,2027-11-15,2026-10-23T08:05:00Z,Emirates Group HQ Finance Wing
rajesh.nambiar@dnata.com,DN-20104,Rajesh Nambiar,Active,true,"dnata-Ramp-Ops,DXB-Airside-Ramp-Supervisors,Cargo-Handling",DXB-AIR-20104,Red Badge - Airside Ramp Operations,Active,2027-05-10,2026-10-23T05:30:00Z,DXB Cargo Mega Terminal Ramp Gate 12
ahmed.alfalasi@dnata.com,DN-20219,Ahmed Al-Falasi,Active,true,"dnata-Cargo-DG,DXB-Airside-All-Zones,Dangerous-Goods-Vault",DXB-AIR-99214,Red Badge - Airside All Zones,Active,2027-03-31,2026-10-22T19:50:00Z,DXB Cargo Airside Gate 7 Restricted
grace.oconnor@dnata.com,DN-20350,Grace O'Connor,Active,true,"dnata-Fleet-Dispatch,DWC-Airside-Operations",DWC-AIR-20350,Red Badge - DWC Airside Operations,Active,2027-02-28,2026-10-23T06:00:00Z,DWC Ramp Operations Office
marcus.vanderbilt@emirates.com,EK-10788,Marcus Vanderbilt,Active,true,"FlightOps-Pilots,A380-Crew-Access,DXB-Crew-Terminal",DXB-AIR-10788,Red Badge - Airside Flight Deck,Active,2027-07-20,2026-10-22T14:15:00Z,DXB Terminal 3 Crew Gate Alpha
priya.sharma@emirates.com,EK-10899,Priya Sharma,Active,true,"CabinCrew-FlightStewards,Inflight-Services-Portal",DXB-AIR-10899,Blue Badge - Terminal & Aircraft Cabins,Active,2027-12-10,2026-10-23T03:50:00Z,DXB Terminal 3 Briefing Room 2
khaled.alnuaimi@emirates.com,EK-10950,Khaled Al-Nuaimi,Active,true,"Engineering-Staff,Avionics-Bay,DXB-Hangar-Access",DXB-AIR-10950,Red Badge - Engineering All Hangars,Active,2027-10-15,2026-10-23T07:25:00Z,Engineering Centre Gate 1
carlos.mendez@emirates.com,EK-11022,Carlos Mendez,Active,true,"FlightOps-Pilots,B777-Crew-Access,DXB-Crew-Terminal",DXB-AIR-11022,Red Badge - Airside Flight Deck,Active,2027-08-30,2026-10-22T23:10:00Z,DXB Terminal 3 Crew Gate Bravo
amina.bello@emirates.com,EK-11105,Amina Bello,Active,true,"HR-SuccessFactors-Admin,Workday-Integration,Corporate-Staff",DXB-HQ-11105,Green Badge - Landside HQ Only,Active,2027-04-15,2026-10-23T08:15:00Z,Emirates Group HQ HR Wing
hassan.albalooshi@dnata.com,DN-20488,Hassan Al-Balooshi,Active,true,"dnata-Catering-Admin,Flight-Kitchen-Access",DXB-AIR-20488,Yellow Badge - Airside Catering Delivery,Active,2027-09-01,2026-10-23T05:00:00Z,DXB Flight Kitchen 1 Secure Dock`;

export function loadAllHRDatasets() {
  const coreHrRaw = rawCoreHrCSV;
  const payrollRaw = rawPayrollCSV;
  const learningRaw = rawLearningCSV;
  const accessDirRaw = rawAccessDirectoryCSV;

  const coreHrParsed = Papa.parse<CoreHREmployee>(coreHrRaw.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const payrollParsed = Papa.parse<any>(payrollRaw.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const learningParsed = Papa.parse<any>(learningRaw.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const accessDirParsed = Papa.parse<any>(accessDirRaw.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const payroll: PayrollRecord[] = payrollParsed.data.map((r) => ({
    payroll_id: r.payroll_id,
    emp_code: r.emp_code,
    national_id_hash: r.national_id_hash,
    account_holder_name: r.account_holder_name,
    bank_name: r.bank_name,
    iban: r.iban,
    base_salary: Number(r.base_salary) || 0,
    currency: r.currency || 'AED',
    flight_allowance: Number(r.flight_allowance) || 0,
    housing_allowance: Number(r.housing_allowance) || 0,
    cost_center_code: r.cost_center_code,
    payment_status: r.payment_status,
    last_processed_date: r.last_processed_date,
  }));

  const learning: LearningRecord[] = learningParsed.data.map((r) => ({
    certification_id: r.certification_id,
    staff_number: r.staff_number,
    attendee_name: r.attendee_name,
    course_code: r.course_code,
    course_name: r.course_name,
    issuing_authority: r.issuing_authority,
    completion_date: r.completion_date,
    valid_until: r.valid_until,
    compliance_status: r.compliance_status,
    score_pct: Number(r.score_pct) || 0,
    renewal_required: String(r.renewal_required).toLowerCase() === 'true',
  }));

  const accessDirectory: AccessDirectoryRecord[] = accessDirParsed.data.map((r) => ({
    user_principal_name: r.user_principal_name,
    employee_reference: r.employee_reference,
    full_name: r.full_name,
    account_status: r.account_status,
    mfa_enforced: String(r.mfa_enforced).toLowerCase() === 'true',
    security_groups: r.security_groups,
    badge_number: r.badge_number,
    airside_security_clearance: r.airside_security_clearance,
    badge_status: r.badge_status,
    badge_expiration: r.badge_expiration,
    last_logon_timestamp: r.last_logon_timestamp,
    last_badge_swipe_location: r.last_badge_swipe_location,
  }));

  return {
    coreHr: coreHrParsed.data,
    payroll,
    learning,
    accessDirectory,
    rawText: {
      coreHr: coreHrRaw,
      payroll: payrollRaw,
      learning: learningRaw,
      accessDirectory: accessDirRaw,
    },
  };
}
