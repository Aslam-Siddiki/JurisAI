import os
import json

CASES = [
    {
        "case_id": "case_01_freelance_unpaid",
        "category": "Payment",
        "party_a_statement": "I designed and delivered the company website on 4 March. Client refuses to pay final invoice of 15000 INR despite using the website live.",
        "party_b_statement": "I never received the source code files and the website had bugs.",
        "evidence": [
            {
                "id": "A-1",
                "type": "receipt",
                "description": "Invoice #104 dated 4 March 2026 for 15000 INR",
                "text": "Tax Invoice 104: Web Design Services. Total Due: 15000 INR. Dated: 2026-03-04. Bank account IFSC: HDFC0001234."
            },
            {
                "id": "A-2",
                "type": "chat",
                "description": "WhatsApp confirmation from B approving deployment",
                "text": "B says: 'The site looks fantastic on live domain! Send across invoice, I will clear it by Friday.' Dated 2026-03-04."
            }
        ],
        "expected_finding": "favours_A"
    },
    {
        "case_id": "case_02_rental_security_deposit",
        "category": "Rental/Deposit",
        "party_a_statement": "My landlord B deducted 30000 INR from my 50000 INR security deposit citing normal repainting costs after 2 years of tenancy.",
        "party_b_statement": "The tenant scratched walls and stained carpets. Repainting cost me 30000 INR.",
        "evidence": [
            {
                "id": "A-1",
                "type": "document",
                "description": "Rental Agreement Clause 8",
                "text": "Clause 8: Normal wear and tear shall not be deducted from the security deposit upon lease termination."
            },
            {
                "id": "A-2",
                "type": "image",
                "description": "Move-out inspection photos showing clean walls",
                "text": "Move-out timestamped inspection photographs: Walls intact, clean condition with negligible routine scuffs."
            }
        ],
        "expected_finding": "favours_A"
    },
    {
        "case_id": "case_03_defective_laptop",
        "category": "Goods/Service",
        "party_a_statement": "Bought a refurbished laptop from B for 25000 INR. The motherboard failed within 4 days. Seller refuses replacement or refund.",
        "party_b_statement": "Buyer dropped the laptop causing internal motherboard fracture. Damage is not covered under our 30-day warranty.",
        "evidence": [
            {
                "id": "B-1",
                "type": "document",
                "description": "Authorized Service Center Engineer Report",
                "text": "Diagnostic Report #781: Physical drop impact mark on lower right chassis corner resulting in broken trace and motherboard crack. User-induced damage."
            },
            {
                "id": "B-2",
                "type": "receipt",
                "description": "Warranty terms signed by buyer",
                "text": "Warranty terms: Physical drop impact or liquid damage voids all replacement warranties."
            }
        ],
        "expected_finding": "favours_B"
    },
    {
        "case_id": "case_04_interior_contract_split",
        "category": "Contract",
        "party_a_statement": "Hired contractor B to renovate kitchen for 80000 INR. He abandoned the job halfway after taking 50000 INR advance.",
        "party_b_statement": "Client changed tile selections 3 times, delayed supplies, and failed to pay the second milestone of 30000 INR as agreed.",
        "evidence": [
            {
                "id": "A-1",
                "type": "receipt",
                "description": "Bank transfer receipt of 50000 INR advance to B",
                "text": "UPI/NEFT Transfer reference 992817: 50000 INR paid to contractor B on 2026-01-10."
            },
            {
                "id": "B-1",
                "type": "document",
                "description": "Milestone schedule contract",
                "text": "Contract milestone 2: 30000 INR due upon cabinet framework completion before countertops."
            },
            {
                "id": "B-2",
                "type": "image",
                "description": "Photos of completed cabinet framework",
                "text": "Timestamped photos showing cabinet carcasses and frames completed on site."
            }
        ],
        "expected_finding": "split"
    },
    {
        "case_id": "case_05_verbal_loan_no_evidence",
        "category": "Payment",
        "party_a_statement": "I gave cash of 20000 INR to my friend B last December. He refuses to return it.",
        "party_b_statement": "I never took any cash loan from A. He has fabricated this story.",
        "evidence": [],
        "expected_finding": "insufficient_evidence"
    },
    {
        "case_id": "case_06_catering_cancellation",
        "category": "Goods/Service",
        "party_a_statement": "Booked B for catering wedding dinner on 15 Feb. B cancelled 24 hours prior via SMS, ruining the event. I demand full 40000 INR deposit back plus compensation.",
        "party_b_statement": "Unforeseen family emergency arose; I offered a replacement caterer but A declined.",
        "evidence": [
            {
                "id": "A-1",
                "type": "receipt",
                "description": "Catering advance payment receipt of 40000 INR",
                "text": "Payment Receipt #881: 40000 INR advance received for 15 Feb wedding dinner event. Non-performance requires 100% refund."
            },
            {
                "id": "A-2",
                "type": "chat",
                "description": "SMS cancellation sent by B on 14 Feb",
                "text": "SMS from B: 'Sorry cannot cater your event tomorrow due to internal crisis. Please manage alternate.'"
            }
        ],
        "expected_finding": "favours_A"
    },
    {
        "case_id": "case_07_car_repair_authorized_work",
        "category": "Goods/Service",
        "party_a_statement": "Mechanic B charged me 18000 INR for AC repairs I never authorized. I only brought the car for oil change.",
        "party_b_statement": "Customer explicitly approved full AC compressor replacement via WhatsApp audio and text when notified of gas leak.",
        "evidence": [
            {
                "id": "B-1",
                "type": "chat",
                "description": "WhatsApp chat history with clear written authorization",
                "text": "WhatsApp Chat on 12 Feb. Mechanic: 'AC compressor is seized, replacement costs 18000 INR. Should we proceed?' Customer A: 'Yes please proceed with compressor replacement so AC works properly.'"
            },
            {
                "id": "B-2",
                "type": "receipt",
                "description": "Supplier invoice for new compressor part",
                "text": "AutoParts Distributor Invoice #9012 for Denso AC Compressor: 14500 INR."
            }
        ],
        "expected_finding": "favours_B"
    },
    {
        "case_id": "case_08_coaching_fee_refund",
        "category": "Contract",
        "party_a_statement": "Enrolled in coaching institute B for 60000 INR for 1 year. Dropped out after 10 days due to substandard teaching. Institute refuses any prorated refund.",
        "party_b_statement": "Our admission form clearly states 'Fees once paid are non-refundable under any circumstances'.",
        "evidence": [
            {
                "id": "A-1",
                "type": "receipt",
                "description": "Receipt of 60000 INR payment",
                "text": "Fee Receipt #319: Total tuition fees 60000 INR paid on 2026-02-01."
            },
            {
                "id": "A-2",
                "type": "document",
                "description": "Dropout letter submitted on day 10",
                "text": "Formal notice of course withdrawal submitted to front desk on 10th February with acknowledgement stamp."
            }
        ],
        "expected_finding": "favours_A"
    },
    {
        "case_id": "case_09_gym_membership_closure",
        "category": "Contract",
        "party_a_statement": "Paid annual gym membership of 15000 INR. The gym abruptly shut down after 2 months. Owner B vanished.",
        "party_b_statement": "Gym temporarily closed for renovation; members will get extension when reopened.",
        "evidence": [
            {
                "id": "A-1",
                "type": "receipt",
                "description": "Annual gym membership tax receipt",
                "text": "FitLife Gym Receipt: Annual membership 15000 INR. Valid from 1 Jan 2026 to 31 Dec 2026."
            },
            {
                "id": "A-2",
                "type": "image",
                "description": "Photo of premises locked with landlord notice",
                "text": "Photograph of gym door locked with court eviction notice for default of commercial rent."
            }
        ],
        "expected_finding": "favours_A"
    },
    {
        "case_id": "case_10_used_phone_purchase",
        "category": "Goods/Service",
        "party_a_statement": "Bought used smartphone from B for 18000 INR. It was blacklisted on network within a week.",
        "party_b_statement": "I sold the phone in good faith. I provided original box and bill. I have no control over network blocking.",
        "evidence": [
            {
                "id": "A-1",
                "type": "document",
                "description": "Telecom operator IMEI blacklist report",
                "text": "Carrier Verification Letter: IMEI 358912301923019 is blocked on Indian networks due to reported loss by previous registered owner."
            },
            {
                "id": "A-2",
                "type": "receipt",
                "description": "Google Pay transfer to B for 18000 INR",
                "text": "GPay Transaction Ref 882199: 18000 INR sent to B for Mobile Purchase."
            }
        ],
        "expected_finding": "favours_A"
    },
    {
        "case_id": "case_11_event_photography_delay",
        "category": "Goods/Service",
        "party_a_statement": "Photographer B delivered wedding album 6 months late. Several ceremony moments were missing.",
        "party_b_statement": "Delivery was delayed because couple did not select shortlist photos for 4 months. All 800 raw photos were delivered on time.",
        "evidence": [
            {
                "id": "B-1",
                "type": "chat",
                "description": "Email thread showing photographer requesting photo shortlist",
                "text": "Email on 10 Oct 2025: 'Please select 100 photos for album binding'. Reminder sent 15 Nov, 20 Dec. Couple sent shortlist only on 1 Feb 2026."
            },
            {
                "id": "B-2",
                "type": "document",
                "description": "Google Drive delivery timestamp of all raw photos",
                "text": "Cloud delivery confirmation: 840 RAW files accessed by client on 5 Oct 2025 (48 hours after wedding)."
            }
        ],
        "expected_finding": "favours_B"
    },
    {
        "case_id": "case_12_tenant_painting_dispute",
        "category": "Rental/Deposit",
        "party_a_statement": "Landlord B refuses to return 20000 INR deposit. House was handed over painted and pristine.",
        "party_b_statement": "Tenant left deep wall holes from TV mounting and uncleaned kitchen grease. Painting cost 20000 INR.",
        "evidence": [
            {
                "id": "A-1",
                "type": "receipt",
                "description": "Painter receipt paid by tenant before handover",
                "text": "Invoice #41 from Asian Paints applicator: 12000 INR for full interior repainting paid by tenant on 28 Feb 2026."
            },
            {
                "id": "A-2",
                "type": "image",
                "description": "Video handover proof showing painted rooms",
                "text": "Key handover video showing freshly painted walls with no TV mounting holes."
            }
        ],
        "expected_finding": "favours_A"
    },
    {
        "case_id": "case_13_freelance_scope_creep",
        "category": "Payment",
        "party_a_statement": "Developer A built extra mobile screens not in original scope. Demands additional 10000 INR.",
        "party_b_statement": "Those 3 screens were natural extensions of login/signup. We never agreed to additional charges in writing.",
        "evidence": [
            {
                "id": "B-1",
                "type": "document",
                "description": "Original Statement of Work (SOW)",
                "text": "SOW Section 4: Fixed price 40000 INR for complete user flow. Any out-of-scope work requires prior written change order signed by both parties."
            }
        ],
        "expected_finding": "favours_B"
    },
    {
        "case_id": "case_14_unreturned_borrowed_tools",
        "category": "Other",
        "party_a_statement": "Lent professional camera lens worth 35000 INR to B for weekend shoot. B returned it with cracked glass element.",
        "party_b_statement": "The lens was already loose and cracked inside the case when handed over to me.",
        "evidence": [
            {
                "id": "A-1",
                "type": "image",
                "description": "Inspection photo taken at handover",
                "text": "High-res photograph taken 10 minutes before handing lens to B showing pristine front and rear optical elements."
            },
            {
                "id": "A-2",
                "type": "chat",
                "description": "WhatsApp apology message from B",
                "text": "WhatsApp message from B on shoot day: 'Man I am so sorry, my assistant tripped on the tripod and the lens hit the floor. Will get it fixed.'"
            }
        ],
        "expected_finding": "favours_A"
    },
    {
        "case_id": "case_15_hotel_booking_noshow",
        "category": "Goods/Service",
        "party_a_statement": "Booked hotel room for 8000 INR. Arrived at 11 PM and hotel had given room away to someone else. Had to sleep in lobby.",
        "party_b_statement": "Guest did not check in by standard 6 PM hold time and did not inform us of late arrival, releasing the room as per policy.",
        "evidence": [
            {
                "id": "A-1",
                "type": "document",
                "description": "Prepaid Booking Confirmation Voucher",
                "text": "Booking Voucher: 100% Prepaid Room Guaranteed for Late Arrival up to 2:00 AM next day. Amount: 8000 INR."
            },
            {
                "id": "A-2",
                "type": "receipt",
                "description": "Credit card receipt of full prepayment",
                "text": "Bank statement showing 8000 INR debited for guaranteed reservation."
            }
        ],
        "expected_finding": "favours_A"
    },
    {
        "case_id": "case_16_conflicting_handyman_claims",
        "category": "Contract",
        "party_a_statement": "Paid handyman 5000 INR to fix plumbing leak. Leak worsened within 2 hours.",
        "party_b_statement": "I fixed the pipe joint properly; the second leak is from the ceiling cistern which is an independent building defect.",
        "evidence": [
            {
                "id": "A-1",
                "type": "chat",
                "description": "Chat complaint sent 2 hours after work",
                "text": "Photo of water puddle on bathroom floor sent to B: 'Water is still leaking everywhere.'"
            },
            {
                "id": "B-1",
                "type": "image",
                "description": "Handyman work photo of newly replaced PVC joint",
                "text": "Close-up photo of new joint showing dry seal and pressure tested."
            }
        ],
        "expected_finding": "split"
    }
]

def generate_cases():
    out_dir = os.path.join(os.path.dirname(__file__), "cases")
    os.makedirs(out_dir, exist_ok=True)
    for c in CASES:
        path = os.path.join(out_dir, f"{c['case_id']}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(c, f, indent=2)
    print(f"Generated {len(CASES)} dispute benchmark cases in {out_dir}")

if __name__ == "__main__":
    generate_cases()
