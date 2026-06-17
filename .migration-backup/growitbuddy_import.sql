--
-- PostgreSQL database dump
--


-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_action_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_action_logs (
    id integer NOT NULL,
    action text NOT NULL,
    detail text NOT NULL,
    ok boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_action_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_action_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_action_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_action_logs_id_seq OWNED BY public.admin_action_logs.id;


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id integer NOT NULL,
    certificate_id text NOT NULL,
    name text NOT NULL,
    email text,
    role text NOT NULL,
    issue_date text NOT NULL,
    status text DEFAULT 'verified'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: certificates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.certificates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: certificates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.certificates_id_seq OWNED BY public.certificates.id;


--
-- Name: client_logos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_logos (
    id integer NOT NULL,
    image_url text NOT NULL,
    alt_text text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    link text DEFAULT ''::text,
    enabled boolean DEFAULT true NOT NULL
);


--
-- Name: client_logos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_logos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_logos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_logos_id_seq OWNED BY public.client_logos.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    type text NOT NULL,
    name text,
    email text NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL
);


--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: media_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_files (
    id integer NOT NULL,
    filename text NOT NULL,
    mimetype text NOT NULL,
    size integer NOT NULL,
    data text NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: media_files_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_files_id_seq OWNED BY public.media_files.id;


--
-- Name: portfolio_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_items (
    id integer NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    youtube_url text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: portfolio_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portfolio_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portfolio_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portfolio_items_id_seq OWNED BY public.portfolio_items.id;


--
-- Name: revoked_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revoked_tokens (
    token text NOT NULL,
    revoked_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


--
-- Name: site_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_content (
    section text NOT NULL,
    data jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    permissions text[] DEFAULT '{}'::text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.team_members_id_seq OWNED BY public.team_members.id;


--
-- Name: admin_action_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_action_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_action_logs_id_seq'::regclass);


--
-- Name: certificates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates ALTER COLUMN id SET DEFAULT nextval('public.certificates_id_seq'::regclass);


--
-- Name: client_logos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_logos ALTER COLUMN id SET DEFAULT nextval('public.client_logos_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: media_files id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_files ALTER COLUMN id SET DEFAULT nextval('public.media_files_id_seq'::regclass);


--
-- Name: portfolio_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items ALTER COLUMN id SET DEFAULT nextval('public.portfolio_items_id_seq'::regclass);


--
-- Name: team_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members ALTER COLUMN id SET DEFAULT nextval('public.team_members_id_seq'::regclass);


--
-- Data for Name: admin_action_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_action_logs (id, action, detail, ok, created_at) FROM stdin;
1	Speed Check	DB responded in 1ms, 14 total records	t	2026-05-05 02:51:18.074363
2	Cache Clear	0 expired session tokens purged from DB	t	2026-05-05 10:21:55.449247
3	Image Cache Clear	Image cache headers refreshed — browsers will re-fetch on next load	t	2026-05-05 10:22:01.448198
4	Speed Check	DB responded in 0ms, 23 total records	t	2026-05-08 01:06:22.580821
5	Issue Scan	2 images over 300 KB — consider compressing	t	2026-05-08 01:06:27.944425
6	Issue Scan	2 images over 300 KB — consider compressing	t	2026-05-08 01:06:39.46645
7	Issue Scan	2 images over 300 KB — consider compressing	t	2026-05-08 01:06:40.42673
8	Cache Clear	0 expired session tokens purged from DB	t	2026-05-08 12:09:14.730813
9	Image Cache Clear	Image cache headers refreshed — browsers will re-fetch on next load	t	2026-05-08 12:09:14.805367
10	Full Cache Clear (Safe)	0 expired tokens purged, DB statistics refreshed	t	2026-05-08 12:09:15.052991
11	Cache Clear	0 expired session tokens purged from DB	t	2026-05-08 12:12:04.957565
12	Cache Clear	0 expired session tokens purged from DB	t	2026-05-08 12:20:28.719032
13	Cache Clear	0 expired session tokens purged from DB	t	2026-05-08 12:26:17.93663
14	Image Cache Clear	Image cache headers refreshed — browsers will re-fetch on next load	t	2026-05-08 12:26:25.786703
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificates (id, certificate_id, name, email, role, issue_date, status, created_at, updated_at) FROM stdin;
2	GB-2026-LAXUC	Priya Kapoor	\N	Content Authority Masterclass	January 2026	verified	2026-05-08 00:35:56.439027	2026-05-08 10:37:13.608
\.


--
-- Data for Name: client_logos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_logos (id, image_url, alt_text, sort_order, created_at, link, enabled) FROM stdin;
74	/api/uploads/1778244117839_test_red.png	Test Logo	1	2026-05-08 12:41:57.841431		t
50	https://cdn.simpleicons.org/youtube/FF0000	YouTube	2	2026-05-06 02:25:26.374612		t
51	https://cdn.simpleicons.org/meta/0082FB	Meta	3	2026-05-06 02:25:32.258738		t
52	https://cdn.simpleicons.org/netflix/E50914	Netflix	4	2026-05-06 02:25:37.706225		t
53	https://cdn.simpleicons.org/spotify/1DB954	Spotify	5	2026-05-06 02:25:43.04255		t
54	https://cdn.simpleicons.org/stripe/635BFF	Stripe	6	2026-05-06 02:25:48.064723		t
55	https://cdn.simpleicons.org/shopify/96BF48	Shopify	7	2026-05-06 02:25:53.105469		t
56	https://cdn.simpleicons.org/hubspot/FF7A59	HubSpot	8	2026-05-06 02:25:58.104859		t
57	https://cdn.simpleicons.org/discord/5865F2	Discord	9	2026-05-06 02:26:02.991934		t
58	https://cdn.simpleicons.org/zoom/2D8CFF	Zoom	10	2026-05-06 02:26:08.441252		t
59	https://cdn.simpleicons.org/figma/F24E1E	Figma	11	2026-05-06 02:26:13.414797		t
60	https://cdn.simpleicons.org/clickup/7B68EE	ClickUp	12	2026-05-06 02:26:18.922534		t
61	https://cdn.simpleicons.org/airtable/18BFFF	Airtable	13	2026-05-06 02:26:24.078856		t
62	https://cdn.simpleicons.org/webflow/4353FF	Webflow	14	2026-05-06 02:26:29.477344		t
63	https://cdn.simpleicons.org/mailchimp/FFE01B	Mailchimp	15	2026-05-06 02:26:34.382033		t
64	https://cdn.simpleicons.org/intercom/1F8DED	Intercom	16	2026-05-06 02:26:40.545474		t
65	https://cdn.simpleicons.org/atlassian/0052CC	Atlassian	17	2026-05-06 02:26:45.587997		t
69	https://cdn.simpleicons.org/trello/0052CC	Trello	21	2026-05-06 02:27:08.499246		t
68	https://cdn.simpleicons.org/notion/000000	Notion	20	2026-05-06 02:27:03.60448		t
72	https://cdn.simpleicons.org/loom/625DF5	Loom	24	2026-05-06 02:27:23.343103		t
67	https://cdn.simpleicons.org/x/000000	X	19	2026-05-06 02:26:58.759739		t
70	https://cdn.simpleicons.org/pinterest/BD081C	Pinterest	22	2026-05-06 02:27:13.346954		t
71	https://cdn.simpleicons.org/squarespace/000000	Squarespace	23	2026-05-06 02:27:18.30371		t
66	https://cdn.simpleicons.org/tiktok/000000	TikTok	18	2026-05-06 02:26:50.494239		t
49	https://cdn.simpleicons.org/google/4285F4	Physicswallah	1	2026-05-06 02:25:20.467214		t
73	/api/uploads/1778112617710_Screenshot_2026-04-24_184500.png	PW	0	2026-05-07 00:10:17.975992		t
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leads (id, type, name, email, data, created_at, status, notes) FROM stdin;
1	contact	Test	notanemail	{"name": "Test", "email": "notanemail", "message": "hi"}	2026-05-05 01:35:16.23922	new	
2	newsletter	\N	notanemail	{"email": "notanemail", "source": "Authority Audit"}	2026-05-05 01:35:16.558633	new	
3	contact	Test	test@example.com	{"name": "Test", "email": "test@example.com", "message": "hi"}	2026-05-05 01:37:33.324585	new	
4	newsletter	\N	test@example.com	{"email": "test@example.com", "source": "Homepage CTA"}	2026-05-05 01:37:33.443129	new	
5	contact	Test	t@t.com	{"name": "Test", "email": "t@t.com", "company": "co", "message": "test message here ok"}	2026-05-05 02:10:22.598727	new	
6	contact	Test User	qatest@growitbuddy.com	{"name": "Test User", "email": "qatest@growitbuddy.com", "company": "TestCo", "message": "This is a QA test message from automated testing, please ignore."}	2026-05-05 02:16:30.898647	new	
7	newsletter	\N	qatest-newsletter@growitbuddy.com	{"email": "qatest-newsletter@growitbuddy.com", "source": "Homepage CTA"}	2026-05-05 02:17:52.021322	new	
8	freelancer	Jane QA Tester	jane-qa@test.com	{"name": "Jane QA Tester", "email": "jane-qa@test.com", "phone": "+1 555 000 0000", "skills": "Video Editing", "experience": "1-2 years"}	2026-05-05 02:22:35.327337	new	
9	freelancer	Jane QA Tester	jane-qa@test.com	{"name": "Jane QA Tester", "email": "jane-qa@test.com", "phone": "+1 555 000 0000", "skills": "Video Editing", "experience": "1-2 years"}	2026-05-05 02:22:35.398941	new	
10	freelancer	Jane QA Tester	jane-qa@growitbuddy-test.com	{"name": "Jane QA Tester", "email": "jane-qa@growitbuddy-test.com", "phone": "+1 555 000 0000", "skills": "Video Editing", "experience": "1–2 years"}	2026-05-05 02:24:25.178953	new	
11	freelancer	Jane QA Tester	jane-qa@growitbuddy-test.com	{"name": "Jane QA Tester", "email": "jane-qa@growitbuddy-test.com", "phone": "+1 555 000 0000", "skills": "Video Editing", "experience": "1-2 years"}	2026-05-05 02:24:38.61593	new	
12	freelancer	Jane QA Tester	jane-qa@growitbuddy-test.com	{"name": "Jane QA Tester", "email": "jane-qa@growitbuddy-test.com", "phone": "+1 555 000 0000", "skills": "Video Editing", "experience": "1-2 years"}	2026-05-05 02:24:38.666601	new	
13	newsletter	\N	test@test.com	{"email": "test@test.com", "source": "Authority Audit"}	2026-05-05 02:51:18.442525	new	
14	newsletter	\N	test@test.com	{"email": "test@test.com", "source": "Authority Audit"}	2026-05-05 02:51:18.510986	new	
15	newsletter	\N	test@test.com	{"email": "test@test.com", "source": "Authority Audit"}	2026-05-05 02:51:18.56583	new	
16	newsletter	\N	test@test.com	{"email": "test@test.com", "source": "Authority Audit"}	2026-05-05 02:51:18.627509	new	
17	newsletter	\N	test@test.com	{"email": "test@test.com", "source": "Authority Audit"}	2026-05-05 02:51:18.672312	new	
18	newsletter	\N	test@example.com	{"email": "test@example.com", "source": "freelancer"}	2026-05-08 01:07:54.094447	new	
20	contact	Sarah Mitchell	sarah.mitchell@brandcraft.co	{"name": "Sarah Mitchell", "email": "sarah.mitchell@brandcraft.co", "company": "BrandCraft Agency", "message": "We are looking for a content authority partner for our SaaS clients. Would love to explore a collaboration."}	2026-05-08 01:09:54.968386	new	
21	contact	James Okafor	james@founderflow.io	{"name": "James Okafor", "email": "james@founderflow.io", "company": "FounderFlow", "message": "Interested in your authority audit service and distribution network for my B2B newsletter."}	2026-05-08 01:09:54.968386	reviewed	Promising lead - follow up this week
22	creator	Priya Kapoor	priya.k@gmail.com	{"name": "Priya Kapoor", "email": "priya.k@gmail.com", "goals": "Build authority in the personal finance space and land brand deals.", "niche": "Personal Finance", "phone": "+1 415 882 3310", "handle": "@priyafinds", "monthlyViews": "50K – 200K/month"}	2026-05-08 01:09:54.968386	new	
23	creator	Marcus Bell	marcusbell.creates@outlook.com	{"name": "Marcus Bell", "email": "marcusbell.creates@outlook.com", "goals": "Expand to YouTube and monetise through brand partnerships.", "niche": "Technology & AI", "phone": "+44 7700 900412", "handle": "@marcusbell.tech", "monthlyViews": "200K – 1M/month"}	2026-05-08 01:09:54.968386	approved	Great profile. Onboarded to influencer network.
24	newsletter	Elena Rossi	elena.rossi@creativepulse.it	{"tags": "service_lead", "email": "elena.rossi@creativepulse.it", "source": "contact"}	2026-05-08 01:09:54.968386	new	
25	newsletter	David Yuen	dyuen@productloop.com	{"tags": "freelancer", "email": "dyuen@productloop.com", "source": "freelancer"}	2026-05-08 01:09:54.968386	new	
29	internship	Aisha Nwosu	aisha.nwosu.intern@gmail.com	{"name": "Aisha Nwosu", "role": "Social Media", "email": "aisha.nwosu.intern@gmail.com", "phone": "+234 701 234 5678", "whyJoin": "I want to learn the authority content model and grow under an expert team.", "experience": "6 months at a Lagos-based agency", "portfolioUrl": "https://instagram.com/aishanwosu.social"}	2026-05-08 01:09:54.968386	new	
27	freelancer	Chloe Park	chloepark.editor@gmail.com	{"name": "Chloe Park", "email": "chloepark.editor@gmail.com", "phone": "+1 213 554 9901", "skills": ["Video Editing", "Motion Design"], "experience": "5 years editing long-form content for B2B SaaS brands. Adobe Premiere + After Effects.", "portfolioUrl": "https://vimeo.com/chloepark"}	2026-05-08 01:09:54.968386	approved	Strong portfolio. Shortlisted.m
31	creator	fglpkjfdkgh	suraj.growitbuddy@gmail.com	{"name": "fglpkjfdkgh", "email": "suraj.growitbuddy@gmail.com", "niche": "Personal Finance", "phone": "99119906098", "handle": "@gfdghhh", "monthlyViews": "50K – 200K/month"}	2026-05-08 01:56:09.411574	new	
26	freelancer	Tunde Adeyemi	tunde.adeyemi@designhub.ng	{"name": "Tunde Adeyemi", "email": "tunde.adeyemi@designhub.ng", "phone": "+234 812 345 6789", "skills": ["Graphic Design", "Thumbnail Design"], "experience": "3 years creating scroll-stopping thumbnails for YouTube creators in the finance niche.", "portfolioUrl": "https://behance.net/tundedesigns"}	2026-05-08 01:09:54.968386	contacted	hgjj
28	full-time	Rohan Verma	rohan.verma.jobs@gmail.com	{"name": "Rohan Verma", "role": "Content Strategist", "email": "rohan.verma.jobs@gmail.com", "phone": "+91 98765 43210", "coverNote": "I have built content ecosystems for three D2C brands from 0 to 100K monthly readers. Excited about GrowitBuddy authority-first approach.", "experience": "4 years", "linkedinUrl": "https://linkedin.com/in/rohanverma"}	2026-05-08 01:09:54.968386	new	
32	newsletter	\N	suraj.growitbuddy@gmail.com	{"tags": "creator", "email": "suraj.growitbuddy@gmail.com", "source": "creator"}	2026-05-08 01:56:22.535161	new	
33	contact	QA Test	qa@test.com	{"name": "QA Test", "email": "qa@test.com", "message": "Automated QA test message - please ignore"}	2026-05-08 03:22:43.230193	new	
34	newsletter	\N	qa-newsletter@test.com	{"tags": "", "email": "qa-newsletter@test.com", "source": "website"}	2026-05-08 03:22:43.495062	new	
35	freelancer	QA Freelancer	qa-freelancer@test.com	{"name": "QA Freelancer", "email": "qa-freelancer@test.com", "skills": "Writing, SEO"}	2026-05-08 03:28:41.284341	new	
36	full-time	QA Applicant	qa-ft@test.com	{"name": "QA Applicant", "role": "Content Strategist", "email": "qa-ft@test.com", "experience": "3 years"}	2026-05-08 03:28:41.418245	new	
37	internship	QA Intern	qa-intern@test.com	{"name": "QA Intern", "role": "Content", "email": "qa-intern@test.com", "phone": null, "whyJoin": null, "portfolioUrl": null}	2026-05-08 03:28:41.550019	new	
38	contact	<script>alert(1)</script>	test@test.com	{"name": "<script>alert(1)</script>", "email": "test@test.com", "message": "XSS test"}	2026-05-08 03:39:18.130987	new	
39	contact	'; DROP TABLE leads; --	test@test.com	{"name": "'; DROP TABLE leads; --", "email": "test@test.com", "message": "SQL injection test"}	2026-05-08 03:39:18.269003	new	
40	newsletter	\N	spam1@test.com	{"tags": "", "email": "spam1@test.com", "source": "website"}	2026-05-08 03:39:18.405794	new	
41	newsletter	\N	spam2@test.com	{"tags": "", "email": "spam2@test.com", "source": "website"}	2026-05-08 03:39:18.541151	new	
42	newsletter	\N	spam3@test.com	{"tags": "", "email": "spam3@test.com", "source": "website"}	2026-05-08 03:39:18.678683	new	
43	contact	Test User	test@example.com	{"name": "Test User", "email": "test@example.com", "message": "This is a QA test message"}	2026-05-08 10:34:06.607306	new	
44	newsletter	\N	newsletter@example.com	{"tags": "", "email": "newsletter@example.com", "source": "website"}	2026-05-08 10:34:06.655898	new	
45	creator	Jane Creator	jane@example.com	{"name": "Jane Creator", "email": "jane@example.com", "niche": "Lifestyle", "handle": "@janecreator"}	2026-05-08 10:34:06.697272	contacted	QA tested
46	full-time	Alice Candidate	alice@example.com	{"name": "Alice Candidate", "role": "Content Strategist", "email": "alice@example.com", "experience": "4 years"}	2026-05-08 10:36:07.602031	new	
48	internship	Intern Student	intern@example.com	{"name": "Intern Student", "role": "Content Intern", "email": "intern@example.com", "phone": null, "whyJoin": null, "portfolioUrl": null}	2026-05-08 10:36:07.695911	new	
49	page-owner	Test Owner	owner@example.com	{"name": "Test Owner", "email": "owner@example.com", "niche": "Tech", "pages": [], "pageCount": "3", "monthlyViews": "50K"}	2026-05-08 10:39:19.532944	new	
50	contact	Arjun Mehta	arjun.mehta@brandlabs.in	{"name": "Arjun Mehta", "email": "arjun.mehta@brandlabs.in", "company": "BrandLabs India", "message": "We are looking for a content strategy partner for our D2C brand. We have a budget of ₹2L/month and want to scale our Instagram and YouTube presence."}	2026-05-08 12:35:34.278757	new	
51	contact	Neha Kapoor	neha.kapoor@techventures.co	{"name": "Neha Kapoor", "email": "neha.kapoor@techventures.co", "company": "TechVentures", "message": "We need a personal branding strategy for our founder. He has 500 LinkedIn connections but no real presence. Looking to build authority in the fintech space."}	2026-05-08 12:35:34.366417	new	
52	contact	Rohan Sinha	rohan.sinha@growthmedia.com	{"name": "Rohan Sinha", "email": "rohan.sinha@growthmedia.com", "company": "Growth Media Co.", "message": "Interested in distribution services for our B2B SaaS startup. We create great content but it barely gets views. Heard about your framework and want to explore."}	2026-05-08 12:35:34.46356	new	
53	creator	Simran Kaur	simran.kaur@gmail.com	{"name": "Simran Kaur", "email": "simran.kaur@gmail.com", "goals": "I want to monetize my audience better and work with premium brands. Currently doing 2-3 paid posts per month but want to scale to 10+.", "niche": "Fashion & Lifestyle", "phone": "+91 9876543210", "handle": "@simrankaur.style", "monthlyViews": "320000"}	2026-05-08 12:35:52.131051	new	
54	creator	Karan Verma	karan.verma@youtube.com	{"name": "Karan Verma", "email": "karan.verma@youtube.com", "goals": "Looking to partner with fintech brands and create a distribution network for my content across multiple platforms.", "niche": "Finance & Investing", "phone": "+91 9812345678", "handle": "@karantalksfinance", "monthlyViews": "850000"}	2026-05-08 12:35:52.216772	new	
55	creator	Ananya Patel	ananya.patel@creator.in	{"name": "Ananya Patel", "email": "ananya.patel@creator.in", "goals": "Want to build a stronger personal brand and get into brand collaborations. Currently posting on Instagram only but want to expand to YouTube.", "niche": "Food & Travel", "phone": "+91 9988776655", "handle": "@ananyaeats", "monthlyViews": "175000"}	2026-05-06 12:36:37.213698	new	
56	creator	Ravi Tiwari	ravi.tiwari@yt.com	{"name": "Ravi Tiwari", "email": "ravi.tiwari@yt.com", "goals": "Looking to build a premium tech review channel and partner with brands like boAt, Noise, and Samsung for long-term deals.", "niche": "Tech & Gadgets", "phone": "+91 9700112233", "handle": "@ravitechreviews", "monthlyViews": "540000"}	2026-05-03 12:36:37.213698	reviewed	Good fit for tech niche campaigns
57	page-owner	Vikram Nair	vikram.nair@memepage.in	{"name": "Vikram Nair", "email": "vikram.nair@memepage.in", "niche": "Business & Entrepreneurship", "pages": "The Startup Guy (1.2M), Business Hacks India (800K), Daily Hustle (400K)", "phone": "+91 9123456789", "pageCount": "3", "monthlyViews": "1200000"}	2026-05-07 12:36:37.213698	new	
58	page-owner	Divya Sharma	divya.sharma@pageowner.com	{"name": "Divya Sharma", "email": "divya.sharma@pageowner.com", "niche": "Fitness & Health", "pages": "FitIndia Daily (650K), Yoga With Divya (200K)", "phone": "+91 9234567890", "pageCount": "2", "monthlyViews": "650000"}	2026-05-05 12:36:37.213698	contacted	Scheduled a call for next week
59	page-owner	Rahul Gupta	rahul.gupta@techpages.io	{"name": "Rahul Gupta", "email": "rahul.gupta@techpages.io", "niche": "Technology & AI", "pages": "AI Tools India (2.1M), TechBytes Hindi (900K), Coding Tips (600K), Startup News India (400K)", "phone": "+91 9345678901", "pageCount": "4", "monthlyViews": "2100000"}	2026-05-01 12:36:37.213698	approved	High-value page network — priority onboarding
60	freelancer	Pooja Nambiar	pooja.nambiar@design.co	{"name": "Pooja Nambiar", "email": "pooja.nambiar@design.co", "phone": "+91 9811223344", "skills": "Graphic Design, Brand Identity", "experience": "4 years", "otherSkill": "Motion graphics for Reels", "portfolioUrl": "https://behance.net/poojanambiar"}	2026-05-04 12:36:37.213698	new	
61	freelancer	Amit Joshi	amit.joshi@copywriter.in	{"name": "Amit Joshi", "email": "amit.joshi@copywriter.in", "phone": "+91 9922334455", "skills": "Copywriting, Content Writing", "experience": "6 years", "otherSkill": "Long-form SEO articles and email sequences", "portfolioUrl": "https://amitjoshi.in/portfolio"}	2026-04-28 12:36:37.213698	approved	Strong portfolio, onboarded to content team
62	freelancer	Shreya Malhotra	shreya.malhotra@videoedits.com	{"name": "Shreya Malhotra", "email": "shreya.malhotra@videoedits.com", "phone": "+91 9633445566", "skills": "Video Editing, Thumbnail Design", "experience": "3 years", "otherSkill": "YouTube Shorts and Instagram Reels editing", "portfolioUrl": "https://youtube.com/shreyaedits"}	2026-05-02 12:36:37.213698	reviewed	
63	full-time	Nikhil Agarwal	nikhil.agarwal@pm.com	{"name": "Nikhil Agarwal", "role": "Content Strategist", "email": "nikhil.agarwal@pm.com", "phone": "+91 9044556677", "coverNote": "I have spent 5 years building content strategies for D2C and SaaS brands. I want to join a growth-focused team and make an impact at scale.", "otherRole": "", "experience": "5 years", "linkedinUrl": "https://linkedin.com/in/nikhilagarwal"}	2026-05-07 12:36:37.213698	new	
64	full-time	Meera Pillai	meera.pillai@marketing.in	{"name": "Meera Pillai", "role": "Growth & Distribution Manager", "email": "meera.pillai@marketing.in", "phone": "+91 9155667788", "coverNote": "Led distribution for a top creator agency with 50+ managed creators. Excited about GrowitBuddy mission to democratize authority building.", "otherRole": "", "experience": "7 years", "linkedinUrl": "https://linkedin.com/in/meerapillai"}	2026-04-30 12:36:37.213698	reviewed	Strong LinkedIn — 8K followers
65	full-time	Aditya Rao	aditya.rao@brand.studio	{"name": "Aditya Rao", "role": "Personal Branding Consultant", "email": "aditya.rao@brand.studio", "phone": "+91 9266778899", "coverNote": "Worked with 30+ founders on positioning and thought leadership. Have a personal brand with 25K followers. Looking for a long-term role.", "otherRole": "", "experience": "4 years", "linkedinUrl": "https://linkedin.com/in/adityarao"}	2026-04-26 12:36:37.213698	contacted	Scheduled intro call
66	internship	Tanya Singh	tanya.singh@college.edu	{"name": "Tanya Singh", "role": "Content Writing Intern", "email": "tanya.singh@college.edu", "phone": "+91 9377889900", "whyJoin": "I am a final-year Mass Comm student who has been blogging for 2 years. I want to learn content distribution and growth marketing from the best in the industry.", "experience": "0-1 year", "portfolioUrl": "https://medium.com/@tanyasingh"}	2026-05-06 12:36:37.213698	new	
67	internship	Dev Khanna	dev.khanna@iit.ac.in	{"name": "Dev Khanna", "role": "Social Media & Growth Intern", "email": "dev.khanna@iit.ac.in", "phone": "+91 9488990011", "whyJoin": "IIT student with a side project page of 45K followers. Want to understand the business side of content and distribution systems.", "experience": "0-1 year", "portfolioUrl": "https://instagram.com/devkhanna_"}	2026-05-03 12:36:37.213698	reviewed	
68	internship	Prachi Verma	prachi.verma@du.ac.in	{"name": "Prachi Verma", "role": "Video & Reels Editing Intern", "email": "prachi.verma@du.ac.in", "phone": "+91 9599001122", "whyJoin": "Editing YouTube videos since 16. Grew a small cooking channel to 18K subscribers. Looking for a structured environment to sharpen my skills and go professional.", "experience": "1-2 years", "portfolioUrl": "https://youtube.com/prachicuts"}	2026-04-23 12:36:37.213698	approved	Hired — starts June 1
69	newsletter	\N	startup.insider@gmail.com	{"tags": ["startup", "growth"], "email": "startup.insider@gmail.com", "source": "Instagram"}	2026-05-07 12:36:37.213698	new	
70	newsletter	\N	content.creator.vikki@yahoo.com	{"tags": ["content", "creator"], "email": "content.creator.vikki@yahoo.com", "source": "Referral"}	2026-05-05 12:36:37.213698	new	
71	newsletter	\N	founder.rahul.m@outlook.com	{"tags": ["founder", "branding"], "email": "founder.rahul.m@outlook.com", "source": "LinkedIn"}	2026-05-02 12:36:37.213698	new	
72	newsletter	\N	test@example.com	{"tags": "", "email": "test@example.com", "source": "test"}	2026-05-09 20:16:53.350577	new	
73	newsletter	\N	newsletter@test.com	{"tags": "test", "email": "newsletter@test.com", "source": "test"}	2026-05-09 20:17:53.588843	new	
74	newsletter	\N	usertest@example.com	{"tags": "creator", "email": "usertest@example.com", "source": "creator"}	2026-05-09 20:19:36.835935	new	
75	newsletter	\N	a@a.com	{"tags": "", "email": "a@a.com", "source": "test"}	2026-05-09 20:19:53.344205	new	
76	newsletter	\N	b@b.com	{"tags": "", "email": "b@b.com", "source": "test"}	2026-05-09 20:19:53.411961	new	
77	newsletter	\N	c@c.com	{"tags": "", "email": "c@c.com", "source": "test"}	2026-05-09 20:19:53.451338	new	
78	newsletter	\N	d@d.com	{"tags": "", "email": "d@d.com", "source": "test"}	2026-05-09 20:19:53.489819	new	
79	newsletter	\N	a@a.com	{"tags": "", "email": "a@a.com", "source": "test"}	2026-05-09 20:21:17.796564	new	
80	newsletter	\N	b@b.com	{"tags": "", "email": "b@b.com", "source": "test"}	2026-05-09 20:21:17.873297	new	
81	newsletter	\N	c@c.com	{"tags": "", "email": "c@c.com", "source": "test"}	2026-05-09 20:21:17.915315	new	
82	newsletter	\N	d@d.com	{"tags": "", "email": "d@d.com", "source": "test"}	2026-05-09 20:21:17.957349	new	
83	newsletter	\N	e@e.com	{"tags": "", "email": "e@e.com", "source": "test"}	2026-05-09 20:21:17.996062	new	
84	newsletter	\N	f@f.com	{"tags": "", "email": "f@f.com", "source": "test"}	2026-05-09 20:21:18.036206	new	
85	newsletter	\N	g@g.com	{"tags": "", "email": "g@g.com", "source": "test"}	2026-05-09 20:21:18.07346	new	
86	newsletter	\N	test@check.com	{"tags": "", "email": "test@check.com", "source": "test"}	2026-05-09 20:37:40.762243	new	
87	newsletter	\N	growitbuddy@gmail.com	{"tags": "", "email": "growitbuddy@gmail.com", "source": "test email check"}	2026-05-09 20:51:20.21578	new	
88	contact	Test Contact 4	contact4@testdummy.com	{"name": "Test Contact 4", "email": "contact4@testdummy.com", "company": "Company 4", "message": "This is a test message from dummy user 4. We are interested in your content marketing services."}	2026-05-09 21:02:32.611145	new	
89	contact	Test Contact 5	contact5@testdummy.com	{"name": "Test Contact 5", "email": "contact5@testdummy.com", "company": "Company 5", "message": "This is a test message from dummy user 5. We are interested in your content marketing services."}	2026-05-09 21:02:32.610556	new	
90	contact	Test Contact 3	contact3@testdummy.com	{"name": "Test Contact 3", "email": "contact3@testdummy.com", "company": "Company 3", "message": "This is a test message from dummy user 3. We are interested in your content marketing services."}	2026-05-09 21:02:32.620604	new	
91	contact	Test Contact 2	contact2@testdummy.com	{"name": "Test Contact 2", "email": "contact2@testdummy.com", "company": "Company 2", "message": "This is a test message from dummy user 2. We are interested in your content marketing services."}	2026-05-09 21:02:32.642601	new	
92	contact	Test Contact 1	contact1@testdummy.com	{"name": "Test Contact 1", "email": "contact1@testdummy.com", "company": "Company 1", "message": "This is a test message from dummy user 1. We are interested in your content marketing services."}	2026-05-09 21:02:32.715041	new	
93	creator	Sneha Patel	creator5@testdummy.com	{"name": "Sneha Patel", "email": "creator5@testdummy.com", "goals": "Grow my audience and collaborate with quality brands.", "niche": "Travel & Culture", "phone": "+91 900000050", "handle": "@snehatravels", "monthlyViews": "50K–60K"}	2026-05-09 21:02:37.091073	new	
94	creator	Karan Mehta	creator4@testdummy.com	{"name": "Karan Mehta", "email": "creator4@testdummy.com", "goals": "Grow my audience and collaborate with quality brands.", "niche": "Food & Lifestyle", "phone": "+91 900000040", "handle": "@anjalieats", "monthlyViews": "40K–50K"}	2026-05-09 21:02:37.09695	new	
151	newsletter	\N	growitbuddy@gmail.com	{"tags": "page_owner", "email": "growitbuddy@gmail.com", "source": "page-owner"}	2026-05-09 21:22:36.079396	new	
95	creator	Anjali Singh	creator3@testdummy.com	{"name": "Anjali Singh", "email": "creator3@testdummy.com", "goals": "Grow my audience and collaborate with quality brands.", "niche": "Tech & Startups", "phone": "+91 900000030", "handle": "@karantech", "monthlyViews": "30K–40K"}	2026-05-09 21:02:37.111882	new	
96	creator	Rohit Verma	creator2@testdummy.com	{"name": "Rohit Verma", "email": "creator2@testdummy.com", "goals": "Grow my audience and collaborate with quality brands.", "niche": "Fitness & Wellness", "phone": "+91 900000020", "handle": "@rohitfits", "monthlyViews": "20K–30K"}	2026-05-09 21:02:37.133331	new	
97	creator	Priya Sharma	creator1@testdummy.com	{"name": "Priya Sharma", "email": "creator1@testdummy.com", "goals": "Grow my audience and collaborate with quality brands.", "niche": "Finance & Investing", "phone": "+91 900000010", "handle": "@priyafinance", "monthlyViews": "10K–20K"}	2026-05-09 21:02:37.158413	new	
98	page-owner	Arjun Pillai	pageowner5@testdummy.com	{"name": "Arjun Pillai", "email": "pageowner5@testdummy.com", "niche": "Education & Learning", "pages": [{"link": "https://facebook.com/testpage5", "name": "Page One"}], "phone": "+91 910000050", "pageCount": "5", "monthlyViews": "600K–700K"}	2026-05-09 21:02:40.912637	new	
99	page-owner	Meera Nair	pageowner4@testdummy.com	{"name": "Meera Nair", "email": "pageowner4@testdummy.com", "niche": "Entertainment", "pages": [{"link": "https://facebook.com/testpage4", "name": "Page One"}], "phone": "+91 910000040", "pageCount": "4", "monthlyViews": "500K–600K"}	2026-05-09 21:02:40.919233	new	
100	page-owner	Vikas Rao	pageowner3@testdummy.com	{"name": "Vikas Rao", "email": "pageowner3@testdummy.com", "niche": "Sports & Fitness", "pages": [{"link": "https://facebook.com/testpage3", "name": "Page One"}], "phone": "+91 910000030", "pageCount": "3", "monthlyViews": "400K–500K"}	2026-05-09 21:02:40.930544	new	
101	page-owner	Neha Joshi	pageowner2@testdummy.com	{"name": "Neha Joshi", "email": "pageowner2@testdummy.com", "niche": "Health & Wellness", "pages": [{"link": "https://facebook.com/testpage2", "name": "Page One"}], "phone": "+91 910000020", "pageCount": "2", "monthlyViews": "300K–400K"}	2026-05-09 21:02:40.948862	new	
102	page-owner	Amit Gupta	pageowner1@testdummy.com	{"name": "Amit Gupta", "email": "pageowner1@testdummy.com", "niche": "Business & Entrepreneurship", "pages": [{"link": "https://facebook.com/testpage1", "name": "Page One"}], "phone": "+91 910000010", "pageCount": "1", "monthlyViews": "200K–300K"}	2026-05-09 21:02:40.964361	new	
103	freelancer	Simran Kaur	freelancer5@testdummy.com	{"name": "Simran Kaur", "email": "freelancer5@testdummy.com", "phone": "+91 920000050", "skills": "Social Media Management", "experience": "5 year(s)", "portfolioUrl": "https://portfolio5.example.com"}	2026-05-09 21:02:44.010105	new	
104	freelancer	Aditya Kumar	freelancer4@testdummy.com	{"name": "Aditya Kumar", "email": "freelancer4@testdummy.com", "phone": "+91 920000040", "skills": "Thumbnail Design", "experience": "4 year(s)", "portfolioUrl": "https://portfolio4.example.com"}	2026-05-09 21:02:44.016585	new	
105	freelancer	Pooja Mishra	freelancer3@testdummy.com	{"name": "Pooja Mishra", "email": "freelancer3@testdummy.com", "phone": "+91 920000030", "skills": "Content Writing", "experience": "3 year(s)", "portfolioUrl": "https://portfolio3.example.com"}	2026-05-09 21:02:44.027406	new	
106	freelancer	Rahul Saxena	freelancer2@testdummy.com	{"name": "Rahul Saxena", "email": "freelancer2@testdummy.com", "phone": "+91 920000020", "skills": "Graphic Design", "experience": "2 year(s)", "portfolioUrl": "https://portfolio2.example.com"}	2026-05-09 21:02:44.04291	new	
107	freelancer	Divya Kapoor	freelancer1@testdummy.com	{"name": "Divya Kapoor", "email": "freelancer1@testdummy.com", "phone": "+91 920000010", "skills": "Video Editing", "experience": "1 year(s)", "portfolioUrl": "https://portfolio1.example.com"}	2026-05-09 21:02:44.054091	new	
108	full-time	Siddharth Nanda	fulltime5@testdummy.com	{"name": "Siddharth Nanda", "role": "Operations Lead", "email": "fulltime5@testdummy.com", "phone": "+91 930000050", "coverNote": "I am passionate about content and authority building. Looking forward to growing with GrowitBuddy.", "experience": "6 years", "linkedinUrl": "https://linkedin.com/in/testuser5"}	2026-05-09 21:02:47.586266	new	
109	full-time	Riya Chopra	fulltime4@testdummy.com	{"name": "Riya Chopra", "role": "Video Producer", "email": "fulltime4@testdummy.com", "phone": "+91 930000040", "coverNote": "I am passionate about content and authority building. Looking forward to growing with GrowitBuddy.", "experience": "5 years", "linkedinUrl": "https://linkedin.com/in/testuser4"}	2026-05-09 21:02:47.591687	new	
110	full-time	Nikhil Jain	fulltime3@testdummy.com	{"name": "Nikhil Jain", "role": "Growth Marketer", "email": "fulltime3@testdummy.com", "phone": "+91 930000030", "coverNote": "I am passionate about content and authority building. Looking forward to growing with GrowitBuddy.", "experience": "4 years", "linkedinUrl": "https://linkedin.com/in/testuser3"}	2026-05-09 21:02:47.6055	new	
111	full-time	Tanvi Desai	fulltime2@testdummy.com	{"name": "Tanvi Desai", "role": "Brand Manager", "email": "fulltime2@testdummy.com", "phone": "+91 930000020", "coverNote": "I am passionate about content and authority building. Looking forward to growing with GrowitBuddy.", "experience": "3 years", "linkedinUrl": "https://linkedin.com/in/testuser2"}	2026-05-09 21:02:47.622497	new	
112	full-time	Ishaan Bose	fulltime1@testdummy.com	{"name": "Ishaan Bose", "role": "Content Strategist", "email": "fulltime1@testdummy.com", "phone": "+91 930000010", "coverNote": "I am passionate about content and authority building. Looking forward to growing with GrowitBuddy.", "experience": "2 years", "linkedinUrl": "https://linkedin.com/in/testuser1"}	2026-05-09 21:02:47.634965	new	
113	internship	Kritika Bhatt	intern5@testdummy.com	{"name": "Kritika Bhatt", "role": "Marketing Research Intern", "email": "intern5@testdummy.com", "phone": "+91 940000050", "whyJoin": "I want to learn from the best and build real-world content skills with GrowitBuddy.", "experience": "Fresher", "portfolioUrl": "https://drive.google.com/test5"}	2026-05-09 21:02:51.04196	new	
114	internship	Abhinav Sharma	intern4@testdummy.com	{"name": "Abhinav Sharma", "role": "Social Media Intern", "email": "intern4@testdummy.com", "phone": "+91 940000040", "whyJoin": "I want to learn from the best and build real-world content skills with GrowitBuddy.", "experience": "Fresher", "portfolioUrl": "https://drive.google.com/test4"}	2026-05-09 21:02:51.046061	new	
115	internship	Nandini Reddy	intern3@testdummy.com	{"name": "Nandini Reddy", "role": "Video Editing Intern", "email": "intern3@testdummy.com", "phone": "+91 940000030", "whyJoin": "I want to learn from the best and build real-world content skills with GrowitBuddy.", "experience": "Fresher", "portfolioUrl": "https://drive.google.com/test3"}	2026-05-09 21:02:51.05723	new	
116	internship	Varun Tiwari	intern2@testdummy.com	{"name": "Varun Tiwari", "role": "Design Intern", "email": "intern2@testdummy.com", "phone": "+91 940000020", "whyJoin": "I want to learn from the best and build real-world content skills with GrowitBuddy.", "experience": "Fresher", "portfolioUrl": "https://drive.google.com/test2"}	2026-05-09 21:02:51.07537	new	
117	internship	Ayesha Khan	intern1@testdummy.com	{"name": "Ayesha Khan", "role": "Content Writing Intern", "email": "intern1@testdummy.com", "phone": "+91 940000010", "whyJoin": "I want to learn from the best and build real-world content skills with GrowitBuddy.", "experience": "Fresher", "portfolioUrl": "https://drive.google.com/test1"}	2026-05-09 21:02:51.092182	new	
118	newsletter	\N	newsletter_social_manager@testdummy.com	{"tags": "social_manager", "email": "newsletter_social_manager@testdummy.com", "source": "social-manager"}	2026-05-09 21:02:54.491355	new	
119	newsletter	\N	newsletter_designer@testdummy.com	{"tags": "graphic_designer", "email": "newsletter_designer@testdummy.com", "source": "designer"}	2026-05-09 21:02:54.504523	new	
120	newsletter	\N	newsletter_editor@testdummy.com	{"tags": "video_editor", "email": "newsletter_editor@testdummy.com", "source": "editor"}	2026-05-09 21:02:54.5054	new	
121	newsletter	\N	newsletter_freelancer@testdummy.com	{"tags": "freelancer", "email": "newsletter_freelancer@testdummy.com", "source": "freelancer"}	2026-05-09 21:02:54.523009	new	
122	newsletter	\N	newsletter_internship@testdummy.com	{"tags": "intern", "email": "newsletter_internship@testdummy.com", "source": "internship"}	2026-05-09 21:02:54.535442	new	
123	newsletter	\N	newsletter_full_time@testdummy.com	{"tags": "career", "email": "newsletter_full_time@testdummy.com", "source": "full-time"}	2026-05-09 21:02:54.549886	new	
124	newsletter	\N	newsletter_page_owner@testdummy.com	{"tags": "page_owner", "email": "newsletter_page_owner@testdummy.com", "source": "page-owner"}	2026-05-09 21:02:54.562887	new	
125	newsletter	\N	newsletter_creator@testdummy.com	{"tags": "creator", "email": "newsletter_creator@testdummy.com", "source": "creator"}	2026-05-09 21:02:54.571234	new	
126	newsletter	\N	general_site@testdummy.com	{"tags": "subscriber", "email": "general_site@testdummy.com", "source": "website"}	2026-05-09 21:02:57.126717	new	
127	newsletter	\N	contact_followup@testdummy.com	{"tags": "service_lead", "email": "contact_followup@testdummy.com", "source": "contact"}	2026-05-09 21:02:57.139911	new	
128	newsletter	\N	audit_user@testdummy.com	{"tags": "subscriber", "email": "audit_user@testdummy.com", "source": "Authority Audit"}	2026-05-09 21:02:57.154557	new	
129	newsletter	\N	blog_reader@testdummy.com	{"tags": "blog_subscriber", "email": "blog_reader@testdummy.com", "source": "blog"}	2026-05-09 21:02:57.176917	new	
130	newsletter	\N	homepage_cta@testdummy.com	{"tags": "subscriber", "email": "homepage_cta@testdummy.com", "source": "Homepage CTA"}	2026-05-09 21:02:57.19217	new	
131	contact	Real Test User	growitbuddy@gmail.com	{"name": "Real Test User", "email": "growitbuddy@gmail.com", "company": "GrowitBuddy Test", "message": "This is a REAL delivery test for the contact form. If you see this in your inbox, email routing is working correctly."}	2026-05-09 21:15:29.808339	new	
132	full-time	Real Test Applicant	careers.growitbuddy@gmail.com	{"name": "Real Test Applicant", "role": "Content Strategist", "email": "careers.growitbuddy@gmail.com", "phone": "+91 9999999999", "coverNote": "This is a REAL delivery test for the careers email. If you see this in your careers inbox, the routing is working correctly.", "experience": "3 years", "linkedinUrl": "https://linkedin.com/in/realtest"}	2026-05-09 21:15:30.610762	new	
133	contact	Suraj Sharma	growitbuddy@gmail.com	{"name": "Suraj Sharma", "email": "growitbuddy@gmail.com", "company": "GrowitBuddy", "message": "Format test — checking new email subject and body layout for the contact form."}	2026-05-09 21:20:57.826668	new	
134	freelancer	Suraj Sharma	growitbuddy@gmail.com	{"name": "Suraj Sharma", "email": "growitbuddy@gmail.com", "skills": "Video Editing", "experience": "2 years", "portfolioUrl": "https://portfolio.example.com"}	2026-05-09 21:20:59.295817	new	
135	newsletter	\N	growitbuddy@gmail.com	{"tags": "blog_subscriber", "email": "growitbuddy@gmail.com", "source": "blog"}	2026-05-09 21:21:00.626137	new	
136	creator	Suraj Sharma	careers.growitbuddy@gmail.com	{"name": "Suraj Sharma", "email": "careers.growitbuddy@gmail.com", "goals": "Format test — checking new email layout for creator form.", "niche": "Finance & Investing", "handle": "@surajfinance", "monthlyViews": "50K–100K"}	2026-05-09 21:21:03.309782	new	
137	full-time	Suraj Sharma	careers.growitbuddy@gmail.com	{"name": "Suraj Sharma", "role": "Content Strategist", "email": "careers.growitbuddy@gmail.com", "coverNote": "Format test — checking new email layout for full-time form.", "experience": "3 years", "linkedinUrl": "https://linkedin.com/in/surajsharma"}	2026-05-09 21:21:04.65765	new	
138	newsletter	\N	careers.growitbuddy@gmail.com	{"tags": "creator", "email": "careers.growitbuddy@gmail.com", "source": "creator"}	2026-05-09 21:21:06.118035	new	
139	internship	Suraj Sharma	careers.growitbuddy@gmail.com	{"name": "Suraj Sharma", "role": "Content Writing Intern", "email": "careers.growitbuddy@gmail.com", "phone": null, "whyJoin": "Format test — checking new email layout for internship form.", "experience": "Fresher", "portfolioUrl": null}	2026-05-09 21:21:07.438727	new	
140	contact	Format Test	growitbuddy@gmail.com	{"name": "Format Test", "email": "growitbuddy@gmail.com", "company": "GrowitBuddy", "message": "Test: contact form — new subject format."}	2026-05-09 21:22:28.732672	new	
141	creator	Format Test	growitbuddy@gmail.com	{"name": "Format Test", "email": "growitbuddy@gmail.com", "niche": "Finance & Investing", "handle": "@testhandle", "monthlyViews": "50K"}	2026-05-09 21:22:29.496597	new	
142	page-owner	Format Test	growitbuddy@gmail.com	{"name": "Format Test", "email": "growitbuddy@gmail.com", "niche": "Business", "pages": [{"link": "https://fb.com/bizpage", "name": "BizPage"}], "pageCount": "2", "monthlyViews": "100K"}	2026-05-09 21:22:30.138043	new	
143	freelancer	Format Test	growitbuddy@gmail.com	{"name": "Format Test", "email": "growitbuddy@gmail.com", "skills": "Video Editing", "experience": "2 years"}	2026-05-09 21:22:30.774474	new	
144	full-time	Format Test	growitbuddy@gmail.com	{"name": "Format Test", "role": "Content Strategist", "email": "growitbuddy@gmail.com", "experience": "3 years", "linkedinUrl": "https://linkedin.com/test"}	2026-05-09 21:22:31.399518	new	
145	internship	Format Test	growitbuddy@gmail.com	{"name": "Format Test", "role": "Content Writing Intern", "email": "growitbuddy@gmail.com", "phone": null, "whyJoin": "Testing internship email format.", "experience": "Fresher", "portfolioUrl": null}	2026-05-09 21:22:32.066355	new	
146	newsletter	\N	growitbuddy@gmail.com	{"tags": "blog_subscriber", "email": "growitbuddy@gmail.com", "source": "blog"}	2026-05-09 21:22:32.762414	new	
147	newsletter	\N	growitbuddy@gmail.com	{"tags": "creator", "email": "growitbuddy@gmail.com", "source": "creator"}	2026-05-09 21:22:33.393098	new	
148	newsletter	\N	growitbuddy@gmail.com	{"tags": "subscriber", "email": "growitbuddy@gmail.com", "source": "Homepage CTA"}	2026-05-09 21:22:34.031848	new	
149	newsletter	\N	growitbuddy@gmail.com	{"tags": "intern", "email": "growitbuddy@gmail.com", "source": "internship"}	2026-05-09 21:22:34.683974	new	
150	newsletter	\N	growitbuddy@gmail.com	{"tags": "career", "email": "growitbuddy@gmail.com", "source": "full-time"}	2026-05-09 21:22:35.36981	new	
\.


--
-- Data for Name: media_files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media_files (id, filename, mimetype, size, data, uploaded_at) FROM stdin;
\.


--
-- Data for Name: portfolio_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.portfolio_items (id, title, category, youtube_url, description, sort_order, created_at, updated_at) FROM stdin;
1	Brand Story Reel – Fitness App Launch	Reels / Shorts	https://www.youtube.com/shorts/vx0RXS9NNRY	High-energy 30-second reel driving 2.1M views for a fitness brand launch campaign.	1	2026-05-05 01:54:27.007593	2026-05-05 01:54:27.007593
2	Long-Form Brand Documentary	Video Editing	https://www.youtube.com/watch?v=dQw4w9WgXcQ	Cinematic 8-minute brand documentary showcasing founder story and company mission.	2	2026-05-05 01:54:27.007593	2026-05-05 01:54:27.007593
3	Viral Meme Page Growth – 0 to 500K	Social Media Management	https://www.youtube.com/watch?v=9bZkp7q19f0	Full social media management case study: grew a meme page from scratch to 500K followers in 4 months.	3	2026-05-05 01:54:27.007593	2026-05-05 01:54:27.007593
4	Product Launch Shorts Series	Reels / Shorts	https://www.youtube.com/shorts/M7lc1UVf-VE	Series of 5 short-form videos for a DTC product launch generating 800K combined views.	4	2026-05-05 01:54:27.007593	2026-05-05 01:54:27.007593
5	Motion Graphics – SaaS Explainer	Graphics	https://www.youtube.com/watch?v=ysz5S6PUM-U	Animated explainer video breaking down a complex SaaS product into a 90-second visual story.	5	2026-05-05 01:54:27.007593	2026-05-05 01:54:27.007593
6	Full Video Edit – Podcast Episode	Video Editing	https://www.youtube.com/watch?v=YQHsXMglC9A	End-to-end edit of a 45-minute podcast: colour grade, captions, B-roll, and thumbnail.	6	2026-05-05 01:54:27.007593	2026-05-05 01:54:27.007593
\.


--
-- Data for Name: revoked_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.revoked_tokens (token, revoked_at, expires_at) FROM stdin;
1778552003485.00aba49a7415524a.super.WyJhbGwiXQ.a8c4cf333a717ec1a472d8e1c068ee9704a4157f843920a17ac1f631254f1299	2026-05-05 21:29:25.723015	2026-05-12 02:13:23.485
1778816356064.d856e98c96abdce3.super.WyJhbGwiXQ.e4bd75d7482220eec46963a7514efe928c708dacf3497e0f0a3a717f5e3db5eb	2026-05-08 03:39:17.067323	2026-05-15 03:39:16.064
\.


--
-- Data for Name: site_content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_content (section, data, updated_at) FROM stdin;
creator-school	{"steps": [{"desc": "Understand our style and expectations.", "title": "Watch Demo", "number": "01"}, {"desc": "Access raw files and editing assets.", "title": "Download Resources", "number": "02"}, {"desc": "Upload your completed edit for review.", "title": "Submit Your Work", "number": "03"}, {"desc": "We evaluate and add you to our network.", "title": "Get Reviewed", "number": "04"}], "eyebrow": "VIDEO EDITORS COOL", "seoDesc": "Join the GrowitBuddy editors pool. Watch the demo, access resources, and submit your work.", "headline": "Join our growing network of editors.", "seoTitle": "Video Editors Pool — GrowitBuddy", "videoUrl": "https://youtu.be/82LboR7IVi4?si=SvHo_DEmqoRup52x", "formTitle": "Submit Your Application", "resources": [{"id": "1", "desc": "Technical and stylistic standards for all submissions.", "link": "", "title": "Editing Guidelines", "btnLabel": "Open"}, {"id": "2", "desc": "Source files for the current project.", "link": "", "title": "Raw Footage", "btnLabel": "Download"}, {"id": "3", "desc": "Logos, fonts, and visual identity files.", "link": "", "title": "Brand Assets", "btnLabel": "Download"}, {"id": "4", "desc": "How to name, export, and share your final edit.", "link": "", "title": "Submission Rules", "btnLabel": "Open"}], "ctaPrimary": "Submit Your Work", "stepsTitle": "How it works.", "description": "Watch the demo, follow the workflow, submit your work, and get added to our internal talent network.", "formSubtext": "Fill in your details and share a link to your completed work.", "ctaSecondary": "View Resources", "finalSubtext": "Submit your work and become part of the GrowitBuddy ecosystem.", "finalHeadline": "Ready to join the network?", "formDisclaimer": "This is a network-based opportunity system, not a guaranteed job offer.", "resourcesTitle": "Resources & Guidelines", "finalCtaPrimary": "Submit Work", "formNotifyEmail": "", "opportunityText": "Top performers may receive freelance, creator, or agency opportunities in the future.", "resourcesSubtext": "Everything you need before submitting.", "finalCtaSecondary": "Watch Demo"}	2026-05-07 20:47:49.184
contact	{"test": 1}	2026-05-08 13:25:45.275
work	{"items": [{"id": "1", "tags": ["LinkedIn", "B2B SaaS"], "stats": [], "title": "Tech Founder to Industry Voice", "metric": "14M", "category": "B2B SaaS · LinkedIn", "imageUrl": "", "subtitle": "LinkedIn Authority Campaign", "description": "A full content marketing system took this founder from zero online presence to the most-cited authority in their SaaS niche - in 6 months.", "metricLabel": "impressions"}, {"id": "2", "tags": ["Content Strategy"], "stats": [], "title": "Agency Owner Authority Engine", "metric": "$2.4M", "category": "Services · Multi-channel", "imageUrl": "", "subtitle": "Multi-channel content strategy", "description": "A systematic content strategy and distribution system drove inbound pipeline that exceeded prior annual revenue.", "metricLabel": "inbound pipeline"}, {"id": "3", "tags": ["YouTube", "Creator"], "stats": [], "title": "Creator Monetization System", "metric": "250K", "category": "Creator Economy · YouTube", "imageUrl": "", "subtitle": "YouTube authority build", "description": "A content strategy built around a proprietary framework compounded into 250K subscribers and $40K/mo in revenue.", "metricLabel": "subscribers"}, {"id": "4", "tags": ["Personal Brand", "PR"], "stats": [], "title": "Executive Personal Brand", "metric": "15+", "category": "Leadership · Podcast & PR", "imageUrl": "", "subtitle": "Podcast & PR strategy", "description": "Personal branding strategy turned a quiet operator into a recognized industry thought leader with consistent media placement.", "metricLabel": "speaking invites / qtr"}, {"id": "5", "tags": ["X / Twitter", "E-commerce"], "stats": [], "title": "E-commerce Founder Growth", "metric": "400%", "category": "E-commerce · X / Twitter", "imageUrl": "", "subtitle": "X / Twitter brand build", "description": "A personal brand-first content marketing approach made this founder synonymous with their product category.", "metricLabel": "branded search growth"}, {"id": "6", "tags": ["Finance", "LinkedIn"], "stats": [], "title": "VC Authority Engine", "metric": "3x", "category": "Finance · LinkedIn", "imageUrl": "", "subtitle": "LinkedIn positioning", "description": "Content strategy and personal branding positioned this venture firm as the category expert - attracting better deals at higher velocity.", "metricLabel": "deal flow growth"}], "subtext": "Real systems. Real execution. Real outcomes.", "headline": "Proof of authority at scale.", "heroStats": [{"value": "700M+", "eyebrow": "Multi-Channel · Content Networks", "headline": "Built large-scale visibility across content ecosystems", "valueLabel": "views generated", "description": "Distributed content across platforms and campaigns to generate massive reach."}, {"value": "200+", "eyebrow": "Services · Authority System", "headline": "Built authority systems for founders and growing brands", "valueLabel": "founders & brands", "description": "Positioned creators and businesses into recognized voices in their niche."}, {"value": "90K+", "eyebrow": "Content Engine · High Volume", "headline": "Executed high-volume content production at scale", "valueLabel": "content assets", "description": "Consistent output across short-form, long-form, and platform-native formats."}]}	2026-05-07 00:10:37.477
page_visibility	{"home": {"mode": "coming_soon", "hidden": false, "message": "", "headline": ""}, "influencers": {"mode": "coming_soon", "hidden": false, "message": "", "headline": ""}}	2026-05-08 02:20:15.441
blog	{"posts": [{"tag": "Founders", "date": "April 10, 2026", "slug": "why-authority-compounds", "title": "Why Authority Compounds (and Traffic Doesn't)", "content": "## The Traffic Trap\\n\\nEvery founder eventually discovers the traffic trap. You publish content, maybe even go viral once or twice, and then... nothing. The spike fades. You're back to square one.\\n\\nTraffic is rented. Authority is owned.\\n\\nWhen you build genuine authority in your space - when people know your name before they need your product - something remarkable happens. Every piece of content you create amplifies the last. Every podcast appearance opens two more. Every client win attracts three more.\\n\\n## What Authority Actually Means\\n\\nAuthority is not the same as popularity. It's **specific credibility in a specific domain** recognized by a specific audience.\\n\\nThe founder known as \\"the LinkedIn guy\\" has traffic. The founder known as \\"the person who redefined how Series A SaaS companies think about go-to-market\\" has authority.\\n\\nOne gets likes. The other closes deals from a DM.\\n\\n## The Compounding Mechanism\\n\\nAuthority compounds through four mechanisms:\\n\\n1. **Network trust transfer** - When someone with authority endorses you, their trust passes to you.\\n2. **Search and discovery** - People find you when searching for expertise, not entertainment.\\n3. **Premium positioning** - Authority justifies premium pricing without lengthy justification.\\n4. **Inbound leverage** - The best opportunities come inbound when authority is established.\\n\\n## How to Start Building It\\n\\nStart with a single specific claim. Not \\"I help companies grow.\\" Try: \\"I help bootstrapped B2B SaaS founders close their first 50 enterprise contracts without a sales team.\\"\\n\\nSpecificity is the seed of authority. Everything else is distribution.", "excerpt": "Most founders chase traffic. The smartest ones build authority - and discover it's the only asset that gets more valuable as you grow.", "readTime": "6 min read", "featuredImage": "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800&h=450&fit=crop"}, {"tag": "Founders", "date": "April 3, 2026", "slug": "content-system-not-content-creation", "title": "Stop Creating Content. Start Building a Content System.", "content": "## The Improvisation Burnout Loop\\n\\nYou've been there: Sunday night, staring at a blank draft, needing to \\"post something\\" tomorrow. You write something mediocre, it gets 12 likes, and you feel like a fraud.\\n\\nThis is the improvisation loop. And it's the single biggest reason smart founders quit on content.\\n\\n## What a Content System Looks Like\\n\\nA content system has four components:\\n\\n### 1. Positioning Foundation\\nBefore you produce a single piece, you need clarity on: Who are you talking to? What do you uniquely believe? What is the one outcome you help them achieve?\\n\\n### 2. The Content Engine\\nThis is your repeatable production process.\\n\\n### 3. The Distribution Loop\\nA system without distribution is a journal.\\n\\n### 4. The Feedback Layer\\nTrack which content drives actual business outcomes.", "excerpt": "The difference between founders who burn out and those who compound isn't talent - it's whether they have a system or are improvising every week.", "readTime": "8 min read", "featuredImage": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=450&fit=crop"}, {"tag": "Founders", "date": "March 27, 2026", "slug": "the-4-pillars-of-founder-authority", "title": "The 4 Pillars of Founder Authority", "content": "## Not All Content Builds Authority\\n\\nWe've analyzed the content output of hundreds of founders. Here's what we found: most content does not build authority. It builds noise.\\n\\n## Pillar 1: Distinctive Positioning\\n\\nAuthority begins with a point of view that is yours and only yours.\\n\\n## Pillar 2: Consistent Signal\\n\\nAuthority requires repetition of the same theme and worldview.\\n\\n## Pillar 3: Proof Architecture\\n\\nPositioning without proof is just opinion.\\n\\n## Pillar 4: Distribution Leverage\\n\\nThe best content that no one reads builds no authority.", "excerpt": "After working with 200+ founders, we've identified the four pillars that separate recognized industry voices from well-kept secrets.", "readTime": "7 min read", "featuredImage": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=450&fit=crop"}, {"tag": "Brand", "date": "April 17, 2026", "slug": "founder-brand-vs-company-brand", "title": "Your Founder Brand is More Valuable Than Your Company Brand", "content": "## The Brand That Lasts\\n\\nMost founders invest heavily in building their company brand. But your personal brand moves with you through every chapter.\\n\\n## Why Founder-Led Content Outperforms Company Content\\n\\nFounder-authored content outperforms brand content by a factor of 5 to 10 in organic reach, engagement, and conversion.", "excerpt": "Companies pivot, rebrand, and get acquired. Your personal authority travels with you forever.", "readTime": "6 min read", "featuredImage": "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=450&fit=crop"}, {"tag": "Creators", "date": "April 20, 2026", "slug": "creator-monetization-without-millions", "title": "How to Monetize Your Audience Before You Hit 10K Followers", "content": "## The Follower Count Myth\\n\\nEvery creator eventually gets told the same thing: \\"Grow the audience first. Monetize later.\\" This advice is not just wrong. It's actively harmful.\\n\\n## The 500-Person Principle\\n\\nA specific, engaged audience of 500 people who see you as the person for one particular problem is worth more commercially than 50,000 general followers.", "excerpt": "You don't need a massive following to earn from your content. You need the right 500 people, the right offer, and a clear path from content to conversion.", "readTime": "7 min read", "featuredImage": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop"}, {"seo": {"noIndex": false, "ogImage": "", "ogTitle": "Distribution Is the Missing Piece in Every Content Strategy", "faqItems": [], "seoTitle": "Content Distribution Strategy: The Missing Piece | GrowitBuddy", "howToSteps": [], "schemaType": "Article", "canonicalUrl": "", "focusKeyword": "content distribution strategy", "searchIntent": "informational", "ogDescription": "Most brands invest in content creation and ignore distribution. Here's the system that changes that.", "metaDescription": "Most content strategies focus on creation and ignore distribution. Learn the four distribution levers that separate brands that compound from brands that plateau.", "secondaryKeywords": "distribution system, content marketing, owned audience"}, "tag": "Strategy", "date": "May 8, 2026", "slug": "distribution-is-the-missing-piece", "title": "Distribution Is the Missing Piece in Every Content Strategy", "content": "<h2>The Creation Trap</h2>\\n  <p>There's a misconception at the heart of most content strategies: that great content finds its own audience. This belief has led thousands of smart, well-resourced brands to invest heavily in production - blog posts, videos, podcasts, newsletters - only to see them land in a vacuum.</p>\\n  <p>Content without distribution is a monologue. Useful, perhaps, but unheard.</p>\\n\\n  <h2>Why Distribution Gets Ignored</h2>\\n  <p>Distribution is less glamorous than creation. Writing a well-researched article feels productive. Crafting a distribution system feels like infrastructure work - invisible, unsexy, and hard to attribute to a single viral moment.</p>\\n  <p>But infrastructure is exactly what separates brands that compound from brands that plateau.</p>\\n\\n  <h2>The Four Distribution Levers</h2>\\n  <p>There are four core levers available to any brand building a distribution system:</p>\\n  <ol>\\n    <li><strong>Owned audiences</strong> - Email lists, SMS subscribers, communities you control and aren't renting from a platform.</li>\\n    <li><strong>Earned reach</strong> - Media coverage, podcast appearances, word-of-mouth, and organic search traffic built through consistency.</li>\\n    <li><strong>Paid amplification</strong> - Meta Ads, Google Ads, and promoted content used to accelerate proven content, not to rescue bad content.</li>\\n    <li><strong>Network leverage</strong> - Strategic partnerships, creator collaborations, and distribution through others' audiences.</li>\\n  </ol>\\n\\n  <h2>The Compounding Effect of Distribution</h2>\\n  <p>The reason distribution matters more than creation in the long run is compounding. When you build an owned audience, every new piece of content goes further. When you establish media relationships, each story gets picked up faster. When you have a functioning ad system, scaling is a budget decision, not a strategy decision.</p>\\n  <p>Creation costs stay relatively constant. Distribution costs drop over time as infrastructure matures.</p>\\n\\n  <h2>Where to Start</h2>\\n  <p>If you're starting from zero, the answer is simple: pick one distribution channel and make it non-negotiable.</p>\\n  <p>Most brands try to be everywhere and end up nowhere. A single email list grown to 5,000 engaged subscribers will outperform a mediocre presence across six platforms every time.</p>\\n  <p>Build one channel to depth. Then add the next. Distribution is not about volume - it's about reliability.</p>\\n\\n  <h2>The Practical Framework</h2>\\n  <p>Every piece of content you create should answer three questions before it's published:</p>\\n  <ol>\\n    <li>Where will this be seen first - and by whom?</li>\\n    <li>What triggers a second wave of reach (shares, search, ads)?</li>\\n    <li>What owned channel does this feed into long-term?</li>\\n  </ol>\\n  <p>If you can't answer these three questions, you don't have a content strategy. You have a content habit. And habits don't compound - systems do.</p>", "excerpt": "Most content strategies stop at creation. The brands that win aren't the ones producing the most content - they're the ones with the best distribution systems.", "readTime": "7 min read", "featuredImage": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=450&fit=crop"}, {"seo": {"noIndex": false, "ogImage": "", "ogTitle": "", "faqItems": [], "seoTitle": "", "howToSteps": [], "schemaType": "Article", "canonicalUrl": "bvkjvkk", "focusKeyword": "", "searchIntent": "", "ogDescription": "", "metaDescription": "", "secondaryKeywords": ""}, "tag": "Founders", "date": "May 8, 2026", "slug": "g", "title": "ghjmnghjnplfghkjnlpfghn", "status": "published", "content": "<h2>The Traffic Trap</h2><h1><p style=\\"font-weight: 400; letter-spacing: normal;\\">Every founder eventually discovers the traffic trap. You publish content, maybe even go viral once or twice, and then... nothing. The spike fades. You're back to square one.jhhjhjhvnvnvnnmmnmnnmmnnmnmmnnmnmnmnnnnu iuguij b</p><p style=\\"font-weight: 400; letter-spacing: normal;\\">Traffic is rented. Authority is owned.</p><p style=\\"font-weight: 400; letter-spacing: normal;\\">When you build genuine authority in your space - when people know your name before they need your product - something remarkable happens. Every piece of content you create amplifies the last. Every podcast appearance opens two more. Every client win attracts three more.</p></h1><h2>What Authority Actually Means</h2><h1><p style=\\"font-weight: 400; letter-spacing: normal;\\">Authority is not the same as popularity. It's&nbsp;<span style=\\"font-weight: 700; color: rgb(11, 11, 11);\\">specific credibility in a specific domain</span>&nbsp;recognized by a specific audience.</p><p style=\\"font-weight: 400; letter-spacing: normal;\\">The founder known as \\"the LinkedIn guy\\" has traffic. The founder known as \\"the person who redefined how Series A SaaS companies think about go-to-market\\" has authority.</p><p style=\\"font-weight: 400; letter-spacing: normal;\\">One gets likes. The other closes deals from a DM.</p><p style=\\"font-weight: 400; letter-spacing: normal;\\"><img src=\\"/api/uploads/1778112617710_Screenshot_2026-04-24_184500.png\\" alt=\\"\\" style=\\"border-radius: 12px; margin: 24px 0px;\\"></p></h1><h2>The Compounding Mechanism</h2><h1><p style=\\"font-weight: 400; letter-spacing: normal;\\">Authority compounds through four mechanisms:</p><ol style=\\"color: rgb(10, 10, 10); font-size: medium; font-weight: 400; letter-spacing: normal;\\"><li><span style=\\"font-weight: 700; color: rgb(11, 11, 11);\\">Network trust transfer</span>&nbsp;- When someone with authority endorses you, their trust passes to you.</li><li><span style=\\"font-weight: 700; color: rgb(11, 11, 11);\\">Search and discovery</span>&nbsp;- People find you when searching for expertise, not entertainment.</li><li><span style=\\"font-weight: 700; color: rgb(11, 11, 11);\\">Premium positioning</span>&nbsp;- Authority justifies premium pricing without lengthy justification.</li><li><span style=\\"font-weight: 700; color: rgb(11, 11, 11);\\">Inbound leverage</span>&nbsp;- The best opportunities come inbound when authority is established.</li></ol></h1><h2>How to Start Building It</h2><h1><p style=\\"font-weight: 400; letter-spacing: normal;\\">Start with a single specific claim. Not \\"I help companies grow.\\" Try: \\"I help bootstrapped B2B SaaS founders close their first 50 enterprise contracts without a sales team.\\"</p><p style=\\"font-weight: 400; letter-spacing: normal;\\">Specificity is the seed of authority. Everything else is distribution.</p></h1>", "excerpt": "", "readTime": "5 min read", "featuredImage": "/api/uploads/1778203394783_image.png"}]}	2026-05-08 01:52:59.205
influencers	{"items": [{"id": "1", "bio": "Top lifestyle creator covering beauty, travel and personal finance.", "name": "Priya Sharma", "tags": ["lifestyle", "beauty", "travel"], "niche": "Lifestyle & Beauty", "handle": "@priyasharma", "country": "India", "platform": "Instagram", "followers": 125000, "isVisible": true, "updatedAt": "2026-05-08T12:27:12.287Z", "engagement": 4.2, "youtubeLinks": [], "audienceCountries": ["India"]}, {"id": "2", "bio": "B2B growth consultant and LinkedIn creator helping SaaS founders build authority through content.", "name": "Raj Malhotra", "tags": ["b2b", "saas", "marketing"], "niche": "B2B Marketing", "handle": "@rajmalhotra", "country": "India", "platform": "LinkedIn", "followers": 48000, "isVisible": true, "updatedAt": "2026-05-08T12:27:12.287Z", "engagement": 6.8, "youtubeLinks": [], "audienceCountries": ["India", "USA", "UK"]}, {"id": "3", "bio": "Tech reviewer and SaaS educator with a highly engaged subscriber base in India and Southeast Asia.", "name": "Sneha Iyer", "tags": ["tech", "saas", "reviews"], "niche": "Tech & SaaS", "handle": "@snehaiyer", "country": "India", "platform": "YouTube", "followers": 92000, "isVisible": true, "updatedAt": "2026-05-08T12:27:12.287Z", "engagement": 5.1, "youtubeLinks": ["https://youtube.com/@snehaiyer"], "audienceCountries": ["India", "Singapore"]}, {"id": "4", "bio": "Personal finance and investing educator. Simplifying stocks, mutual funds and crypto for everyday Indians.", "name": "Aryan Kapoor", "tags": ["finance", "investing", "crypto"], "niche": "Finance", "handle": "@aryanmoneytalks", "country": "India", "platform": "Instagram", "followers": 218000, "isVisible": true, "updatedAt": "2026-05-08T12:27:12.287Z", "engagement": 3.9, "youtubeLinks": ["https://youtube.com/@aryanmoneytalks"], "audienceCountries": ["India"]}, {"id": "5", "bio": "Certified fitness trainer and wellness creator. Posts daily workout routines, meal preps and mindset content.", "name": "Meghna Reddy", "tags": ["fitness", "wellness", "nutrition"], "niche": "Fitness", "handle": "@meghna.fits", "country": "India", "platform": "Instagram", "followers": 67000, "isVisible": true, "updatedAt": "2026-05-08T12:27:12.287Z", "engagement": 7.3, "youtubeLinks": [], "audienceCountries": ["India", "UAE"]}, {"id": "6", "bio": "Solo traveller covering offbeat destinations across India and South Asia. Known for raw, cinematic travel vlogs.", "name": "Vikash Pandey", "tags": ["travel", "vlog", "india"], "niche": "Travel", "handle": "@vikashpandey", "country": "India", "platform": "YouTube", "followers": 156000, "isVisible": true, "updatedAt": "2026-05-08T12:27:12.287Z", "engagement": 4.6, "youtubeLinks": ["https://youtube.com/@vikashpandey"], "audienceCountries": ["India", "UK", "Canada"]}, {"id": "7", "bio": "Food blogger and recipe developer. Creates easy Indian and fusion recipes with a focus on healthy eating.", "name": "Tanvi Oberoi", "tags": ["food", "recipes", "healthy"], "niche": "Food", "handle": "@tanvi.eats", "country": "India", "platform": "Instagram", "followers": 89000, "isVisible": true, "updatedAt": "2026-05-08T12:27:12.287Z", "engagement": 5.8, "youtubeLinks": ["https://youtube.com/@tanvieats"], "audienceCountries": ["India", "USA"]}, {"id": "8", "bio": "Mobile gaming creator focused on BGMI, Free Fire and Valorant. Known for strategy guides and live tournaments.", "name": "Sahil Mehta", "tags": ["gaming", "bgmi", "esports"], "niche": "Gaming", "handle": "@sahilgaming", "country": "India", "platform": "YouTube", "followers": 340000, "isVisible": true, "updatedAt": "2026-05-08T12:27:12.287Z", "engagement": 3.2, "youtubeLinks": ["https://youtube.com/@sahilgaming"], "audienceCountries": ["India"]}], "genres": ["Lifestyle & Beauty", "Tech & SaaS", "B2B Marketing", "Finance", "Fitness", "Travel", "Food", "Gaming", "Fashion", "Parenting"], "countries": ["India", "USA", "UAE", "UK", "Singapore", "Canada", "Australia"]}	2026-05-08 12:37:33.766
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_members (id, name, email, password_hash, permissions, is_active, created_at, updated_at) FROM stdin;
4	Suraj	suraj.growitbuddy@gmail.com	7262ada4ff3bf1084168ee052ae542fc:6301beaf09642d3858942942f5fbbadb63e14e8cae62e0b9486e5de923433af1a66d4377324e1d8c88dfba9c63d67f64643943a9f52c54d55f40d1848d110492	{leads,blog}	t	2026-05-08 10:26:47.736323	2026-05-08 12:20:48.258
\.


--
-- Name: admin_action_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_action_logs_id_seq', 14, true);


--
-- Name: certificates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.certificates_id_seq', 4, true);


--
-- Name: client_logos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.client_logos_id_seq', 75, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leads_id_seq', 151, true);


--
-- Name: media_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.media_files_id_seq', 1, false);


--
-- Name: portfolio_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.portfolio_items_id_seq', 8, true);


--
-- Name: team_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.team_members_id_seq', 10, true);


--
-- Name: admin_action_logs admin_action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_action_logs
    ADD CONSTRAINT admin_action_logs_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_certificate_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_id_unique UNIQUE (certificate_id);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: client_logos client_logos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_logos
    ADD CONSTRAINT client_logos_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: media_files media_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (id);


--
-- Name: portfolio_items portfolio_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_pkey PRIMARY KEY (id);


--
-- Name: revoked_tokens revoked_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (token);


--
-- Name: site_content site_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_content
    ADD CONSTRAINT site_content_pkey PRIMARY KEY (section);


--
-- Name: team_members team_members_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_email_unique UNIQUE (email);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--


