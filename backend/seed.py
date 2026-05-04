"""Seed the database with realistic UCLA football roster data."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app import models

models.Base.metadata.create_all(bind=engine)

# (name, school, position, year, height, weight, player_type, actual_salary, projected_salary, coach_rating, notes)
UCLA_ROSTER = [
    # QB (3) — total ~$2.28M
    ("Ethan Garbers",       "UCLA", "QB", "Grad", "6'3\"", 220, "Roster", 1350000, None, 5, "Starter, transfer from Washington, strong arm"),
    ("Chase Griffin",       "UCLA", "QB", "Sr",   "6'2\"", 205, "Roster",  850000, None, 4, "Career backup, great leader and practice QB"),
    ("Jake Dawson",         "UCLA", "QB", "So",   "6'1\"", 192, "Roster",   75000, None, 3, "Developmental QB, strong camp showing"),

    # RB (4) — total ~$995K
    ("TJ Harden",           "UCLA", "RB", "Jr",   "5'10\"", 210, "Roster", 580000, None, 4, "Lead back, excellent pass blocker"),
    ("Carson Steele",       "UCLA", "RB", "So",   "6'0\"",  215, "Roster", 230000, None, 4, "Power runner, improving as receiver"),
    ("Marcus Ellis",        "UCLA", "RB", "Sr",   "5'11\"", 205, "Roster", 150000, None, 3, "Veteran depth, reliable in short yardage"),
    ("Jordan Adams",        "UCLA", "RB", "Fr",   "5'9\"",  192, "Roster",  35000, None, 3, "Freshman with elite breakaway speed"),

    # WR (7) — total ~$2.49M
    ("J. Michael Sturdivant","UCLA","WR", "Jr",   "6'3\"",  205, "Roster", 880000, None, 5, "WR1, elite route runner, first-round prospect"),
    ("Kyle Ford",            "UCLA","WR", "Sr",   "6'2\"",  200, "Roster", 620000, None, 4, "Slot specialist, reliable hands"),
    ("Logan Loya",           "UCLA","WR", "So",   "6'0\"",  185, "Roster", 400000, None, 4, "Rising sophomore, playmaker after catch"),
    ("Kam Brown",            "UCLA","WR", "Jr",   "6'1\"",  190, "Roster", 280000, None, 4, "Versatile, strong YAC ability"),
    ("Jake Bobo",            "UCLA","WR", "Grad", "6'4\"",  215, "Roster", 170000, None, 3, "Red zone target, strong hands"),
    ("Jadyn Marshall",       "UCLA","WR", "So",   "6'0\"",  182, "Roster", 100000, None, 3, "Developing WR, good route running"),
    ("Isaiah Newell",        "UCLA","WR", "Fr",   "6'1\"",  175, "Roster",  35000, None, 2, "Raw freshman, upside as deep threat"),

    # TE (3) — total ~$560K
    ("Moliki Matavao",      "UCLA", "TE", "Jr",   "6'5\"",  250, "Roster", 420000, None, 4, "Big play TE, strong blocker in-line"),
    ("Hudson Habermehl",    "UCLA", "TE", "So",   "6'4\"",  240, "Roster", 110000, None, 3, "Blocking TE, developing as receiver"),
    ("Luke Donovan",        "UCLA", "TE", "Fr",   "6'3\"",  228, "Roster",  30000, None, 2, "Developmental, athletic mover for his size"),

    # OT (4) — total ~$1.83M
    ("Raiqwon O'Neal",      "UCLA", "OT", "Sr",   "6'6\"",  305, "Roster", 950000, None, 5, "LT1, All-Big Ten candidate, elite pass protector"),
    ("Garrett DiGiorgio",   "UCLA", "OT", "Sr",   "6'5\"",  298, "Roster", 550000, None, 4, "RT starter, reliable run blocker"),
    ("Gino Garcia",         "UCLA", "OT", "Jr",   "6'5\"",  290, "Roster", 240000, None, 3, "Swing tackle, versatile depth"),
    ("Isaiah Thomas",       "UCLA", "OT", "So",   "6'6\"",  285, "Roster",  85000, None, 3, "Developing tackle, great length"),

    # OG (4) — total ~$808K
    ("Jake Burton",         "UCLA", "OG", "Sr",   "6'4\"",  310, "Roster", 480000, None, 4, "LG starter, physical finisher"),
    ("Alex Van Dyke",       "UCLA", "OG", "Jr",   "6'3\"",  305, "Roster", 220000, None, 3, "RG starter, good lateral quickness"),
    ("Marcus Freeman",      "UCLA", "OG", "So",   "6'3\"",  295, "Roster",  80000, None, 3, "Interior depth, improving technique"),
    ("Tyler Jackson",       "UCLA", "OG", "Fr",   "6'2\"",  290, "Roster",  28000, None, 2, "G/C developmental player"),

    # C (2) — total ~$510K
    ("Duke Clemens",        "UCLA", "C",  "Jr",   "6'3\"",  305, "Roster", 390000, None, 4, "Starter, excellent line calls and communication"),
    ("Sam Green",           "UCLA", "C",  "So",   "6'2\"",  292, "Roster", 120000, None, 3, "Backup center, quality snapper"),

    # EDGE (5) — total ~$3.30M
    ("Laiatu Latu",         "UCLA", "EDGE","Jr",  "6'5\"",  250, "Roster",1750000, None, 5, "Top EDGE in country, consensus top-5 NFL pick"),
    ("Gabriel Murphy",      "UCLA", "EDGE","Jr",  "6'4\"",  245, "Roster", 720000, None, 5, "High motor, elite pass rush win rate"),
    ("Oluwafemi Oladejo",   "UCLA", "EDGE","Sr",  "6'4\"",  248, "Roster", 490000, None, 4, "Veteran EDGE, excellent run stopper"),
    ("Carl Jones Jr.",      "UCLA", "EDGE","So",  "6'3\"",  238, "Roster", 160000, None, 3, "Rotational rusher, improving speed-to-power"),
    ("Tyler Manoa",         "UCLA", "EDGE","Jr",  "6'3\"",  242, "Roster", 180000, None, 3, "Versatile, can play EDGE or DT"),

    # DT (5) — total ~$1.50M
    ("Grayson Murphy",      "UCLA", "DT", "Sr",   "6'2\"",  295, "Roster", 620000, None, 4, "Nose tackle, anchor of defensive line"),
    ("Jay Toia",            "UCLA", "DT", "Jr",   "6'2\"",  305, "Roster", 450000, None, 4, "3-technique specialist, quick first step"),
    ("Datona Jackson",      "UCLA", "DT", "Jr",   "6'1\"",  300, "Roster", 280000, None, 3, "Interior rusher, disruptive at point of attack"),
    ("Keanu Laakulu",       "UCLA", "DT", "So",   "6'3\"",  290, "Roster", 110000, None, 3, "Physical presence, developing pass rush"),
    ("Sione Tupou",         "UCLA", "DT", "Fr",   "6'2\"",  285, "Roster",  40000, None, 2, "Project DT, outstanding size and length"),

    # LB (6) — total ~$1.65M
    ("Darius Muasau",       "UCLA", "LB", "Grad", "6'2\"",  232, "Roster", 720000, None, 5, "MLB captain, leader of defense, excellent blitzer"),
    ("Luc Bequette",        "UCLA", "LB", "Sr",   "6'3\"",  235, "Roster", 420000, None, 4, "WILL LB, strong in zone coverage"),
    ("Damien Moore",        "UCLA", "LB", "Jr",   "6'1\"",  225, "Roster", 250000, None, 3, "Versatile LB, plays all three downs"),
    ("Chris Kanu",          "UCLA", "LB", "Jr",   "6'1\"",  228, "Roster", 150000, None, 3, "Special teams ace, physical tackler"),
    ("James Wood",          "UCLA", "LB", "So",   "6'2\"",  220, "Roster",  80000, None, 3, "Developing linebacker, high ceiling"),
    ("Marcus Smith",        "UCLA", "LB", "Fr",   "6'0\"",  212, "Roster",  28000, None, 2, "Raw freshman LB, excellent instincts"),

    # CB (6) — total ~$2.0M
    ("Jaylin Davies",       "UCLA", "CB", "Sr",   "6'0\"",  195, "Roster", 820000, None, 5, "CB1, elite press man coverage, NFL prospect"),
    ("Devin Kirkwood",      "UCLA", "CB", "Jr",   "5'11\"", 185, "Roster", 480000, None, 4, "CB2, great ball skills, slot capable"),
    ("John Humphrey",       "UCLA", "CB", "Jr",   "6'0\"",  190, "Roster", 340000, None, 4, "Nickel CB, reliable tackler"),
    ("Caleb Johnson",       "UCLA", "CB", "Jr",   "6'1\"",  188, "Roster", 200000, None, 3, "Outside corner depth, big frame"),
    ("Cameron Johnson",     "UCLA", "CB", "So",   "5'11\"", 182, "Roster", 120000, None, 3, "Slot corner, developing in zone"),
    ("Imani Ramsay",        "UCLA", "CB", "Fr",   "5'10\"", 178, "Roster",  40000, None, 2, "Freshman DB, excellent athleticism"),

    # S (6) — total ~$1.86M
    ("Jay Shaw",            "UCLA", "S",  "Sr",   "6'2\"",  205, "Roster", 720000, None, 5, "FS1, defensive leader, instinctive ball hawk"),
    ("Stephan Blaylock",    "UCLA", "S",  "Jr",   "6'1\"",  200, "Roster", 480000, None, 4, "SS starter, physical run support"),
    ("Quentin Lake",        "UCLA", "S",  "Grad", "6'1\"",  205, "Roster", 350000, None, 4, "Versatile safety, plays box or deep"),
    ("Kamari Ramsey",       "UCLA", "S",  "So",   "5'11\"", 192, "Roster", 180000, None, 3, "FS backup, good coverage instincts"),
    ("Bryan Jones",         "UCLA", "S",  "So",   "6'0\"",  195, "Roster",  95000, None, 3, "SS depth, improved tackling this camp"),
    ("Devon Williams",      "UCLA", "S",  "Fr",   "6'0\"",  190, "Roster",  30000, None, 2, "Developmental safety, high upside"),
]

# 20 Portal targets at other schools
PORTAL_PLAYERS = [
    ("Marcus Collins",   "Ohio State",   "WR",   "Jr",   "6'2\"",  200, "Portal", None, 1200000, 4, "Elite slot receiver, 85 catches last season"),
    ("Deon Brooks",      "Alabama",      "EDGE", "Jr",   "6'5\"",  252, "Portal", None, 1400000, 5, "All-SEC caliber, 12 sacks last year"),
    ("Tyler Smith",      "Texas",        "OT",   "Sr",   "6'6\"",  308, "Portal", None,  950000, 4, "Power run blocker, immediate starter"),
    ("Marcus Thompson",  "Michigan",     "QB",   "Jr",   "6'3\"",  218, "Portal", None, 1100000, 4, "Dual threat, solid arm strength"),
    ("Isaiah Davis",     "Oregon",       "RB",   "Jr",   "5'11\"", 208, "Portal", None,  650000, 4, "Explosive cutter, 1000 yards last season"),
    ("Caleb Rivers",     "USC",          "WR",   "Sr",   "6'1\"",  193, "Portal", None,  900000, 4, "Deep threat, 4.38 forty"),
    ("Jordan Brown",     "Penn State",   "LB",   "Jr",   "6'2\"",  230, "Portal", None,  600000, 3, "Run stopper, improving in coverage"),
    ("Andre Smith",      "Florida",      "S",    "Sr",   "6'1\"",  202, "Portal", None,  550000, 4, "Ballhawk safety, 5 INTs last season"),
    ("Brian Watson",     "Notre Dame",   "OG",   "Jr",   "6'4\"",  312, "Portal", None,  400000, 3, "Interior OL, strong run blocker"),
    ("Chris Lee",        "Utah",         "CB",   "Jr",   "5'11\"", 187, "Portal", None,  480000, 4, "Physical corner, good press technique"),
    ("Devon Martin",     "Washington",   "TE",   "Sr",   "6'4\"",  245, "Portal", None,  350000, 3, "Receiving TE, soft hands in traffic"),
    ("Eric Johnson",     "Oklahoma",     "DT",   "Jr",   "6'2\"",  302, "Portal", None,  620000, 4, "Disruptive interior rusher"),
    ("Felix Rodriguez",  "Texas A&M",    "LB",   "Grad", "6'1\"",  228, "Portal", None,  750000, 4, "Experienced MLB, elite blitzing"),
    ("Greg Williams",    "Florida State","WR",   "Sr",   "6'0\"",  190, "Portal", None,  700000, 3, "Reliable possession receiver"),
    ("Harry Chen",       "Stanford",     "C",    "Sr",   "6'3\"",  300, "Portal", None,  280000, 3, "Smart center, experienced in pro-style offense"),
    ("Ivan Jackson",     "Arizona State","EDGE", "So",   "6'4\"",  240, "Portal", None,  500000, 3, "High upside pass rusher, needs refinement"),
    ("James Davis",      "Colorado",     "RB",   "Jr",   "5'10\"", 200, "Portal", None,  320000, 3, "Between-the-tackles runner"),
    ("Kyle Thompson",    "Oregon State", "QB",   "Sr",   "6'2\"",  210, "Portal", None,  400000, 3, "Game manager, accurate short-intermediate"),
    ("Jayden Cole",      "Georgia",      "CB",   "So",   "6'0\"",  192, "Portal", None,  800000, 5, "Lockdown corner, 4-star prospect playing time"),
    ("Kevin Carter",     "LSU",          "DT",   "Sr",   "6'3\"",  298, "Portal", None,  700000, 4, "Veteran DT, experience in SEC competition"),
]

# 10 HS Recruits
RECRUIT_PLAYERS = [
    ("Aaron Mitchell",   "IMG Academy",       "QB",   "Fr",  "6'3\"", 205, "Recruit", None, 500000, 4, "5-star, elite arm talent and mobility"),
    ("Brandon Hughes",   "Mater Dei",         "WR",   "Fr",  "6'2\"", 188, "Recruit", None, 350000, 4, "5-star WR, exceptional route runner"),
    ("Carlos Reyes",     "St. John Bosco",    "OT",   "Fr",  "6'6\"", 295, "Recruit", None, 280000, 4, "4-star OT, elite athleticism for position"),
    ("Derek Johnson",    "Lakewood",          "CB",   "Fr",  "6'0\"", 180, "Recruit", None, 200000, 3, "4-star DB, long and physical"),
    ("Eli Brown",        "Centennial (AZ)",   "EDGE", "Fr",  "6'4\"", 238, "Recruit", None, 380000, 4, "5-star EDGE, exceptional motor"),
    ("Frank White",      "Buford (GA)",       "LB",   "Fr",  "6'2\"", 220, "Recruit", None, 220000, 3, "4-star LB, sideline-to-sideline athlete"),
    ("George Martinez",  "Bishop Gorman",     "RB",   "Fr",  "5'11\"",198, "Recruit", None, 300000, 4, "4-star RB, lightning cuts and top speed"),
    ("Henry Wilson",     "Duncanville (TX)",  "DT",   "Fr",  "6'3\"", 290, "Recruit", None, 250000, 3, "4-star DT, immovable in the run game"),
    ("Isaac Thomas",     "Corona del Mar",    "S",    "Fr",  "6'1\"", 190, "Recruit", None, 150000, 3, "3-star S, UCLA legacy recruit"),
    ("Jacob Robinson",   "Serra (CA)",        "WR",   "Fr",  "6'1\"", 182, "Recruit", None, 400000, 5, "5-star WR, national top-10 recruit"),
]

# Cap sheet depth chart assignments for UCLA roster
# (player_name_fragment, depth_chart_position, string_number)
CAP_SHEET_ASSIGNMENTS = [
    # QB
    ("Ethan Garbers",       "QB", 1),
    ("Chase Griffin",       "QB", 2),
    ("Jake Dawson",         "QB", 3),
    # RB
    ("TJ Harden",           "RB", 1),
    ("Carson Steele",       "RB", 2),
    ("Marcus Ellis",        "RB", 3),
    ("Jordan Adams",        "RB", 4),
    # WR
    ("J. Michael Sturdivant","WR",1),
    ("Kyle Ford",           "WR", 2),
    ("Logan Loya",          "WR", 3),
    ("Kam Brown",           "WR", 4),
    ("Jake Bobo",           "WR", 5),
    ("Jadyn Marshall",      "WR", 6),
    ("Isaiah Newell",       "WR", 7),
    # TE
    ("Moliki Matavao",      "TE", 1),
    ("Hudson Habermehl",    "TE", 2),
    ("Luke Donovan",        "TE", 3),
    # OL — string 1 = starters (LT, LG, C, RG, RT), string 2 = backups, string 3 = depth
    ("Raiqwon O'Neal",      "OL", 1),
    ("Jake Burton",         "OL", 2),
    ("Duke Clemens",        "OL", 3),
    ("Alex Van Dyke",       "OL", 4),
    ("Garrett DiGiorgio",   "OL", 5),
    ("Gino Garcia",         "OL", 6),
    ("Marcus Freeman",      "OL", 7),
    ("Sam Green",           "OL", 8),
    ("Isaiah Thomas",       "OL", 9),
    ("Tyler Jackson",       "OL", 10),
    # DL
    ("Grayson Murphy",      "DL", 1),
    ("Jay Toia",            "DL", 2),
    ("Datona Jackson",      "DL", 3),
    ("Keanu Laakulu",       "DL", 4),
    ("Sione Tupou",         "DL", 5),
    # EDGE
    ("Laiatu Latu",         "EDGE", 1),
    ("Gabriel Murphy",      "EDGE", 2),
    ("Oluwafemi Oladejo",   "EDGE", 3),
    ("Tyler Manoa",         "EDGE", 4),
    ("Carl Jones Jr.",      "EDGE", 5),
    # LB
    ("Darius Muasau",       "LB", 1),
    ("Luc Bequette",        "LB", 2),
    ("Damien Moore",        "LB", 3),
    ("Chris Kanu",          "LB", 4),
    ("James Wood",          "LB", 5),
    ("Marcus Smith",        "LB", 6),
    # CB
    ("Jaylin Davies",       "CB", 1),
    ("Devin Kirkwood",      "CB", 2),
    ("John Humphrey",       "CB", 3),
    ("Caleb Johnson",       "CB", 4),
    ("Cameron Johnson",     "CB", 5),
    ("Imani Ramsay",        "CB", 6),
    # S
    ("Jay Shaw",            "S",  1),
    ("Stephan Blaylock",    "S",  2),
    ("Quentin Lake",        "S",  3),
    ("Kamari Ramsey",       "S",  4),
    ("Bryan Jones",         "S",  5),
    ("Devon Williams",      "S",  6),
]


def seed():
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(models.CapSheetEntry).delete()
        db.query(models.Player).delete()
        db.commit()
        print("Cleared existing data.")

        all_players_data = UCLA_ROSTER + PORTAL_PLAYERS + RECRUIT_PLAYERS
        player_map = {}

        for row in all_players_data:
            name, school, position, year, height, weight, ptype, actual, projected, rating, notes = row
            p = models.Player(
                name=name,
                school=school,
                position=position,
                year=year,
                height=height,
                weight=weight,
                player_type=ptype,
                actual_salary=actual,
                projected_salary=projected,
                coach_rating=rating,
                notes=notes,
            )
            db.add(p)
            db.flush()
            player_map[name] = p.id

        db.commit()
        print(f"Inserted {len(all_players_data)} players.")

        # Seed cap sheet entries
        for name, position_group, string_num in CAP_SHEET_ASSIGNMENTS:
            pid = player_map.get(name)
            if pid:
                entry = models.CapSheetEntry(
                    player_id=pid,
                    depth_chart_position=position_group,
                    string_number=string_num,
                )
                db.add(entry)

        db.commit()
        print(f"Inserted {len(CAP_SHEET_ASSIGNMENTS)} cap sheet entries.")

        # Print salary summary
        roster_players = [r for r in UCLA_ROSTER]
        total = sum(r[7] for r in roster_players if r[7])
        print(f"\nUCLA Roster total salary: ${total:,.0f}")
        print(f"Cap budget: $20,500,000")
        print(f"Cap remaining: ${20500000 - total:,.0f}")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
