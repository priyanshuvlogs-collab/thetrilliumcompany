"""Adds the ad scripts for every site to scripts.json.

Each site gets a 16:9 walkthrough, a 9:16 reel and a 1:1 agency teaser.
Claims come from each site's own copy (headline, description, sections).
"""
import json, os

P = os.path.join(os.path.dirname(__file__), "scripts.json")
data = json.load(open(P))

FIL, YASH, KILLIAN, BETH, EMMA, JENNISSA = (
    "VOpMaaltMDRqwhpkfjBl", "iLFuWmTNKH2CLzZOEhBG", "Whez8hBysHW6IVGRgjGA",
    "FLj50PrMa40MhGHappOt", "YEENOUza6MPsbkc1De9E", "TP9tTcKVBL2Minn2NS9E")
WARM, TECH, UP = "audio/music/warm.mp3", "audio/music/tech.mp3", "audio/music/upbeat.mp3"


def F(say, title, look=None, hl=None, sub=None):
    b = {"kind": "feature", "say": say, "title": title}
    if look: b["look"] = look
    if hl: b["highlight"] = hl
    if sub: b["sub"] = sub
    return b


def H(say, hl, title=None, sub=None):
    b = {"kind": "hook", "say": say, "highlight": hl}
    if title: b["title"] = title
    if sub: b["sub"] = sub
    return b


def B(say, sub=None):
    b = {"kind": "brand", "say": say}
    if sub: b["sub"] = sub
    return b


def C(say, title, hl, sub=None):
    b = {"kind": "cta", "say": say, "title": title, "highlight": hl}
    if sub: b["sub"] = sub
    return b


def teaser(brand, say_brand=None):
    return [
        {"kind": "brand", "say": f"This is the new website for {say_brand or brand},"},
        {"kind": "agency", "say": "designed and built by The Trillium Company."},
        C("Want one for your business? Let's talk.", "Want one for your business?", ["your", "business?"]),
    ]


S = {}

S["preserve-life-cpr"] = dict(
    brand="Preserve Life CPR", tagline="WSIB-approved first aid & CPR training, Ontario", domain="preservelifecpr.com",
    ctaLabel="Book your course", voice=FIL, music=WARM,
    walk=[
        H("Would you know what to do if someone collapsed in front of you?", ["collapsed"]),
        B("Preserve Life CPR makes first aid training simple, right here in Ontario."),
        F("Start with eight hours online,", "8 hours online.", "Intermediate First Aid", ["online."], "Start with 8 hours online,"),
        F("then finish with one hands-on day in class.", "Then one day in class.", "Training Programs", ["class."]),
        F("It's WSIB approved, and your certificate arrives as a PDF.", "WSIB-approved. PDF certificate.", "Free Emergency", ["wsib-approved."]),
        {"kind": "stat", "say": "Enrol for one hundred thirty five dollars and sixty cents.", "stat": "$135.60", "statLabel": "Enrol for"},
        C("Book your course at preservelifecpr dot com.", "Book your course", ["course"], "Book your course at preservelifecpr.com."),
    ],
    reel=[
        H("Learn CPR and first aid in Ontario.", ["cpr"]),
        F("Eight hours online.", "8 hours online.", "Intermediate First Aid", ["online."], "8 hours online."),
        F("One day in class.", "1 day in class.", "Training Programs", ["class."], "1 day in class."),
        F("WSIB approved.", "WSIB-approved.", "CPR Basics", ["wsib-approved."]),
        B("Preserve Life CPR."),
        C("Book at preservelifecpr dot com.", "Book your course", ["course"], "Book at preservelifecpr.com."),
    ],
)

S["actfirstsafety"] = dict(
    brand="Aceis Group", tagline="Workplace safety across Ontario since 2009", domain="aceisgroup.com",
    ctaLabel="Book a safety consult", voice=FIL, music=WARM,
    walk=[
        H("Industry without injury.", ["injury."]),
        B("Aceis Group has helped Ontario employers build safety systems since two thousand nine.",
          "Aceis Group has helped Ontario employers build safety systems since 2009."),
        F("First aid, WHMIS and fall protection training,", "Training people remember.", "Three ways Aceis", ["remember."]),
        F("inspections and safety systems that hold up,", "Inspections that hold up.", "A system you can see", ["hold", "up."]),
        F("and road safety, from Hamilton to Ottawa.", "Hamilton to Ottawa.", "Hamilton to Ottawa", ["ottawa."]),
        C("Book a safety consult at aceisgroup dot com.", "Book a safety consult", ["consult"], "Book a safety consult at aceisgroup.com."),
    ],
    reel=[
        H("Keep your crew safe and working.", ["safe"]),
        F("Safety training.", "Safety training.", "Training people", ["training."]),
        F("Site inspections.", "Site inspections.", "Inspections and OHS", ["inspections."]),
        F("Road safety.", "Road safety.", "Road safety", ["road"]),
        B("Aceis Group. Industry without injury."),
        C("Visit aceisgroup dot com.", "Book a safety consult", ["consult"], "Visit aceisgroup.com."),
    ],
)

S["hashmi-accounting"] = dict(
    brand="Hashmi Accounting", tagline="Bookkeeping, tax & payroll for small businesses",
    ctaLabel="Book a call", voice=FIL, music=WARM,
    walk=[
        H("Dreading tax season again?", ["tax", "season"]),
        B("Hashmi Accounting handles bookkeeping, tax returns and payroll for small businesses."),
        F("We work inside the software you already use,", "Works with your software.", "We work inside", ["software."]),
        F("reconcile your books every month,", "Books reconciled monthly.", "How working with us", ["monthly."]),
        F("and keep your payroll on schedule.", "Payroll, on schedule.", "Payroll", ["schedule."]),
        F("Fixed monthly fees, quoted before we start.", "Fixed monthly fees.", "One accountant", ["fixed"]),
        C("Book a short call with Hashmi Accounting.", "Book a short call", ["call"]),
    ],
    reel=[
        H("Clean books. Calm tax season.", ["calm"]),
        F("Bookkeeping.", "Bookkeeping.", "Bookkeeping", ["bookkeeping."]),
        F("Tax returns.", "Tax returns.", "Tax returns", ["tax"]),
        F("Payroll.", "Payroll.", "Payroll", ["payroll."]),
        B("Hashmi Accounting."),
        C("Book a short call today.", "Book a short call", ["call"]),
    ],
)

S["cryptocurrency"] = dict(
    brand="Indi Radio", tagline="Live Punjabi radio from Surrey, Canada", ctaLabel="Listen live", voice=YASH, music=UP,
    walk=[
        H("Looking for Punjabi radio that feels like home?", ["punjabi", "radio"]),
        B("Indi Radio is live Punjabi radio from Surrey, British Columbia."),
        F("Call in to the show with Indi Jaswal,", "Call in. Request a song.", "LATEST CLIPS", ["request"]),
        F("hear Punjabi music and culture, twenty four seven,", "Punjabi music, 24/7.", "EVERYTHING ON", ["24/7."],
          "hear Punjabi music and culture, 24/7,"),
        F("and it's free, heard worldwide.", "Free, worldwide.", "JOIN THE INDI", ["free,"]),
        C("Press play on Indi Radio.", "Listen live", ["live"]),
    ],
    reel=[
        H("Live Punjabi radio from Surrey, Canada.", ["punjabi"]),
        F("Call-in shows.", "Call-in shows.", "LATEST", ["call-in"]),
        F("Music twenty four seven.", "Music 24/7.", "EVERYTHING", ["24/7."], "Music 24/7."),
        F("Free to listen.", "Free to listen.", "JOIN", ["free"]),
        B("Indi Radio."),
        C("Tune in now.", "Listen live", ["live"]),
    ],
)

S["prinshi"] = dict(
    brand="Prinshi Trades", tagline="Premium heavyweight streetwear", ctaLabel="See the drops", voice=YASH, music=UP,
    walk=[
        H("Heavyweight. Oversized. Built to last.", ["heavyweight."]),
        B("Prinshi Trades makes premium heavyweight streetwear."),
        F("Four hundred GSM hoodies and oversized tees,", "400 GSM hoodies.", "CURRENT DROPS", ["400"],
          "400 GSM hoodies and oversized tees,"),
        F("made in Ludhiana, India,", "Made in Ludhiana.", "Sample Hoodie 01", ["ludhiana."]),
        F("and founded in Toronto.", "Founded in Toronto.", "FAQ", ["toronto."]),
        C("Shop the latest drop.", "Shop the drop", ["drop"]),
    ],
    reel=[
        H("Premium heavyweight streetwear.", ["heavyweight"]),
        F("Four hundred GSM.", "400 GSM.", "CURRENT", ["400"], "400 GSM."),
        F("Oversized fits.", "Oversized fits.", "Sample Hoodie", ["oversized"]),
        F("Made in Ludhiana.", "Made in Ludhiana.", "Sample Drop 02", ["ludhiana."]),
        B("Prinshi Trades."),
        C("Shop the drop.", "Shop the drop", ["drop"]),
    ],
)

S["hustlebuddies"] = dict(
    brand="Hustle Buddies", tagline="AI-powered marketing for growing businesses", ctaLabel="Book a free call", voice=KILLIAN, music=TECH,
    accent="rgb(249,115,22)",
    walk=[
        H("Is marketing eating your whole week?", ["whole", "week?"]),
        B("Hustle Buddies is an AI marketing agency for growing businesses."),
        F("We create your content,", "AI content creation.", "AI Content Creation", ["content"]),
        F("run smarter ad campaigns,", "Smarter paid ads.", "Paid Advertising", ["ads."]),
        F("and automate the work that slows you down.", "Marketing automation.", "Marketing Automation", ["automation."]),
        C("Book a free consultation with Hustle Buddies.", "Book a free consultation", ["free"]),
    ],
    reel=[
        H("AI-powered marketing that helps you grow.", ["ai-powered"]),
        F("Content.", "Content.", "AI Content", ["content."]),
        F("Paid ads.", "Paid ads.", "Paid Advertising", ["ads."]),
        F("Automation.", "Automation.", "Marketing Automation", ["automation."]),
        B("Hustle Buddies."),
        C("Book a free consultation.", "Book a free call", ["free"]),
    ],
)

S["northbank"] = dict(
    brand="Northbank Advisory", tagline="Clear advice for growing teams", ctaLabel="Book an intro call", voice=FIL, music=WARM,
    walk=[
        H("Starting a company is hard enough without the admin.", ["admin."]),
        B("Northbank Advisory gives founders clear advice, without the jargon."),
        F("Set up your finances,", "Finance set-up.", "Finance set-up", ["finance"]),
        F("make your first hires,", "First hires.", "First hires", ["first"]),
        F("and build a weekly rhythm your team will keep.", "Operating rhythm.", "Operating rhythm", ["rhythm."]),
        F("Every engagement has a fixed fee.", "Fixed fee. Written scope.", "Less admin", ["fixed"]),
        C("Book a free intro call.", "Book an intro call", ["intro"]),
    ],
    reel=[
        H("Clear advice for growing teams.", ["clear"]),
        F("Finance.", "Finance.", "Finance set-up", ["finance."]),
        F("First hires.", "First hires.", "First hires", ["hires."]),
        F("Operating rhythm.", "Operating rhythm.", "Operating rhythm", ["rhythm."]),
        B("Northbank Advisory."),
        C("Book a free intro call.", "Book an intro call", ["intro"]),
    ],
)

S["learnfrench"] = dict(
    brand="Lumen Français", tagline="Coach IA pour le TEF Canada et le TCF Canada", ctaLabel="Commencer", voice=JENNISSA,
    teaser_voice=EMMA, music=WARM, accent="rgb(64,110,190)",
    walk=[
        H("Vous visez le NCLC 7 pour votre immigration ?", ["nclc", "7"]),
        B("Lumen Français est un coach IA pour le TEF Canada et le TCF Canada."),
        F("Il travaille les quatre compétences,", "Quatre compétences.", "Votre score officiel", ["compétences."]),
        F("parce que votre score officiel, c'est votre compétence la plus faible.", "Votre point faible compte.",
          "TEF Canada ou TCF", ["faible"]),
        F("Une stratégie différente pour le NCLC 5, 7 ou 8 à 9.", "NCLC 5, 7 ou 8–9.", "NCLC 5, 7", ["nclc"],
          "Une stratégie différente pour le NCLC 5, 7 ou 8–9."),
        C("Commencez en trois minutes.", "Commencez aujourd'hui", ["aujourd'hui"], "Commencez en 3 minutes."),
    ],
    reel=[
        H("Préparez le TEF ou le TCF Canada.", ["tef", "tcf"]),
        F("Quatre compétences.", "Quatre compétences.", "Quatre barres", ["compétences."]),
        F("Votre niveau réel.", "Votre niveau réel.", "TEF Canada ou TCF", ["réel."]),
        F("Une stratégie par NCLC.", "Une stratégie par NCLC.", "NCLC 5", ["nclc."]),
        B("Lumen Français."),
        C("Commencez en trois minutes.", "Commencer", ["commencer"], "Commencez en 3 minutes."),
    ],
)

S["komal"] = dict(
    brand="Signal Desk", tagline="AI workflows for one-person brands", ctaLabel="Find your starting point", voice=KILLIAN, music=TECH,
    walk=[
        H("Tired of AI prompts that go nowhere?", ["nowhere?"]),
        B("Signal Desk builds AI workflows for one-person brands."),
        F("Playbooks you can actually follow,", "Playbooks you follow.", "Three playbooks", ["follow."]),
        F("an honest index of the tools worth paying for,", "An honest tool index.", "Tools we would", ["honest"]),
        F("and small systems you can install in an afternoon.", "Install in an afternoon.", "Weekly Content Sprint", ["afternoon."]),
        C("Find your starting point at Signal Desk.", "Systems, not prompts.", ["systems,"]),
    ],
    reel=[
        H("Systems, not prompts.", ["systems,"]),
        F("Playbooks.", "Playbooks.", "Three playbooks", ["playbooks."]),
        F("Tool reviews.", "Tool reviews.", "Tools we would", ["tool"]),
        F("Content sprints.", "Content sprints.", "Weekly Content Sprint", ["sprints."]),
        B("Signal Desk."),
        C("Find your starting point.", "Start here", ["here"]),
    ],
)

S["sms"] = dict(
    brand="NINE", tagline="A full marketing workbench for $9 a month", ctaLabel="Start 7-day trial", voice=BETH, music=TECH,
    walk=[
        H("Paying ninety nine dollars a month for AI marketing tools?", ["$99/mo"], "Paying $99/mo for AI tools?",
          "Paying $99 a month for AI marketing tools?"),
        B("NINE is a full marketing workbench for nine dollars a month.", "NINE is a full marketing workbench for $9 a month."),
        F("Brand voice and campaign kits,", "Brand voice & campaigns.", "Eight modules", ["brand"]),
        F("ad copy and SEO briefs,", "Ads & SEO briefs.", "Ads Workshop", ["seo"]),
        F("and client reports, all in one place.", "Eight modules. One brain.", "Straight answers", ["one"]),
        {"kind": "stat", "say": "One plan. Nine dollars a month.", "stat": "$9", "statLabel": "Per month"},
        C("Start your seven day trial.", "Start your trial", ["trial"], "Start your 7-day trial."),
    ],
    reel=[
        H("A full marketing workbench.", ["workbench."]),
        F("Campaigns.", "Campaigns.", "Campaign Studio", ["campaigns."]),
        F("SEO briefs.", "SEO briefs.", "SEO Briefs", ["seo"]),
        F("Ads.", "Ads.", "Ads Workshop", ["ads."]),
        B("NINE. Nine dollars a month.", "NINE. $9 a month."),
        C("Start your seven day trial.", "Start your trial", ["trial"], "Start your 7-day trial."),
    ],
)

S["replymaster"] = dict(
    brand="ReplyMaster", tagline="Reply to every customer, in your voice", ctaLabel="Start for free", voice=BETH, music=TECH,
    walk=[
        H("Another review waiting for a reply?", ["review"]),
        B("ReplyMaster helps you reply to every customer, everywhere, in your voice."),
        F("Paste or import a message,", "Paste in a message.", "From mention to reply", ["message."]),
        F("pick a tone,", "Pick your tone.", "Everything you need", ["tone."]),
        F("and get an on-brand reply in seconds.", "On-brand in seconds.", "Simple, transparent pricing", ["seconds."]),
        C("Start for free with ReplyMaster.", "Start for free", ["free"]),
    ],
    reel=[
        H("Reply to every customer, in your voice.", ["every"]),
        F("Reviews.", "Reviews.", "Everything you need", ["reviews."]),
        F("Comments.", "Comments.", "From mention", ["comments."]),
        F("Mentions.", "Mentions.", "Simple, transparent", ["mentions."]),
        B("ReplyMaster."),
        C("Start for free.", "Start for free", ["free"]),
    ],
)

S["aiupdates"] = dict(
    brand="AIupdates", tagline="Everything in tech & AI, in one place", ctaLabel="Read today's news", voice=KILLIAN, music=TECH,
    walk=[
        H("Too much AI news to keep up with?", ["ai", "news"]),
        B("AIupdates puts everything happening in tech and AI in one place."),
        F("A real-time news feed from the best sources,", "Real-time news feed.", "Real-time news feed", ["real-time"]),
        F("a directory of the AI models that matter,", "AI model directory.", "Frontier labs", ["directory."]),
        F("and member deals on the tools you already pay for.", "Deals & coupons.", "Free to read", ["deals"]),
        C("Read today's news free at AIupdates.", "Read today's news", ["news"]),
    ],
    reel=[
        H("Tech and AI news, in one place.", ["ai"]),
        F("Real-time news.", "Real-time news.", "Real-time news feed", ["real-time"]),
        F("Model directory.", "Model directory.", "Frontier labs", ["directory."]),
        F("Deals and coupons.", "Deals & coupons.", "Deals & coupons", ["deals"]),
        B("AIupdates."),
        C("Read today's news free.", "Read today's news", ["news"]),
    ],
)

S["clipper"] = dict(
    brand="Pro Clipper", tagline="Turn long videos into viral clips", ctaLabel="Generate clips", voice=KILLIAN, music=TECH,
    walk=[
        H("Your best moments are buried in long videos.", ["buried"]),
        B("Pro Clipper turns long videos into viral clips."),
        F("It transcribes Hindi and English,", "Hindi + English captions.", "Multilingual", ["hindi"]),
        F("finds the moments people will watch,", "Finds the best moments.", None, ["best"]),
        F("and renders vertical clips with captions burned in.", "Vertical, ready to post.", "Studio-grade", ["vertical,"]),
        C("Drop in a video and get your clips.", "Get your clips", ["clips"]),
    ],
    reel=[
        H("Long video in. Viral clips out.", ["viral"]),
        F("Hindi and English.", "Hindi + English.", "Multilingual", ["hindi"]),
        F("Best moments found.", "Best moments found.", None, ["best"]),
        F("Vertical and captioned.", "Vertical. Captioned.", "Studio-grade", ["captioned."]),
        B("Pro Clipper."),
        C("Get your clips today.", "Get your clips", ["clips"]),
    ],
)

S["facelesscut"] = dict(
    brand="FacelessCut", tagline="Faceless clips into clean YouTube cuts", ctaLabel="Open the studio", voice=KILLIAN, music=TECH,
    walk=[
        H("Making YouTube videos without showing your face?", ["face?"]),
        B("FacelessCut turns a faceless clip into a clean YouTube cut."),
        F("Upload your B-roll and voiceover,", "Upload your clip.", None, ["upload"]),
        F("it takes out silences, fillers and repeats,", "Clean & split.", None, ["clean"]),
        F("then adds a hook, chapters and captions.", "Hook, chapters, captions.", None, ["hook,"]),
        C("Open the studio and make your first cut.", "Open the studio", ["studio"]),
    ],
    reel=[
        H("Faceless videos, cut clean.", ["faceless"]),
        F("Upload a clip.", "Upload a clip.", None, ["upload"]),
        F("Fillers removed.", "Fillers removed.", None, ["removed."]),
        F("Hook and captions added.", "Hook + captions.", None, ["hook"]),
        B("FacelessCut."),
        C("Open the studio.", "Open the studio", ["studio"]),
    ],
)

S["high-ticket-system"] = dict(
    brand="BookedAI", tagline="Your AI appointment setter", ctaLabel="Try the demo", voice=KILLIAN, music=TECH,
    walk=[
        H("Leads going cold before you call them back?", ["cold"]),
        B("BookedAI is an AI appointment setter for coaches and consultants."),
        F("A lead fills in your form,", "A lead fills your form.", None, ["form."]),
        F("the agent replies in seconds and qualifies them,", "Replies in seconds.", None, ["seconds."]),
        F("and books the call on your calendar.", "Booked on your calendar.", None, ["booked"]),
        C("Try the demo and watch it work.", "Try the demo", ["demo"]),
    ],
    reel=[
        H("Your AI appointment setter.", ["ai"]),
        F("Replies in seconds.", "Replies in seconds.", None, ["seconds."]),
        F("Qualifies the lead.", "Qualifies the lead.", None, ["qualifies"]),
        F("Books the call.", "Books the call.", None, ["books"]),
        B("BookedAI."),
        C("Try the demo.", "Try the demo", ["demo"]),
    ],
)

S["phantom-meme-bot"] = dict(
    brand="Phantom Meme Bot", tagline="Open-source Solana trading bot", ctaLabel="Open the dashboard", voice=KILLIAN, music=TECH,
    walk=[
        H("Trading meme coins on Solana?", ["solana?"]),
        B("Phantom Meme Bot is an open-source trading bot for Solana."),
        F("It routes trades through Jupiter,", "Jupiter routing.", None, ["jupiter"]),
        F("runs a safety screen on every token,", "Token safety screen.", None, ["safety"]),
        F("and starts in paper mode by default.", "Paper mode by default.", None, ["paper"]),
        C("Test your strategy in paper mode first.", "Start in paper mode", ["paper"]),
    ],
    reel=[
        H("A Solana trading bot you can read.", ["solana"]),
        F("Jupiter routing.", "Jupiter routing.", None, ["jupiter"]),
        F("Token safety checks.", "Token safety checks.", None, ["safety"]),
        F("Paper mode first.", "Paper mode first.", None, ["paper"]),
        B("Phantom Meme Bot."),
        C("Start in paper mode.", "Start in paper mode", ["paper"]),
    ],
)

for slug, s in S.items():
    s["teaser"] = teaser(s["brand"])
    data[slug] = s
data["blushpicnic"].update(voice=EMMA, music=UP)
json.dump(data, open(P, "w"), indent=1, ensure_ascii=False)
print(len(data), "sites")
