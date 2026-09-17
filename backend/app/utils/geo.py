import math

# Chennai Hub Coordinates Dictionary
CHENNAI_HUBS = {
    "Anna Nagar": {"lat": 13.0850, "lng": 80.2100},
    "Tambaram": {"lat": 12.9249, "lng": 80.1000},
    "Ambattur": {"lat": 13.1143, "lng": 80.1548},
    "Avadi": {"lat": 13.1147, "lng": 80.1018},
    "Velachery": {"lat": 12.9759, "lng": 80.2212},
    "Adyar": {"lat": 13.0012, "lng": 80.2565},
    "T. Nagar": {"lat": 13.0418, "lng": 80.2341},
    "Guindy": {"lat": 13.0067, "lng": 80.2026},
    "Porur": {"lat": 13.0382, "lng": 80.1565},
    "Mylapore": {"lat": 13.0368, "lng": 80.2676},
    "Nungambakkam": {"lat": 13.0569, "lng": 80.2425},
    "Kodambakkam": {"lat": 13.0481, "lng": 80.2210},
    "Royapettah": {"lat": 13.0535, "lng": 80.2656},
    "Perungudi": {"lat": 12.9716, "lng": 80.2448},
    "Sholinganallur": {"lat": 12.9010, "lng": 80.2279},
    "Madipakkam": {"lat": 12.9623, "lng": 80.1986},
    "Poonamallee": {"lat": 13.0475, "lng": 80.1108},
    "Red Hills": {"lat": 13.1867, "lng": 80.1847},
    "Egmore": {"lat": 13.0732, "lng": 80.2609},
    "Koyambedu": {"lat": 13.0694, "lng": 80.1948},
    "Saidapet": {"lat": 13.0213, "lng": 80.2231},
    "Pallavaram": {"lat": 12.9675, "lng": 80.1491},
    "Chromepet": {"lat": 12.9516, "lng": 80.1462},
    "Madhuravoyal": {"lat": 13.0612, "lng": 80.1676},
    "Mogappair": {"lat": 13.0836, "lng": 80.1747},
    "Thoraipakkam": {"lat": 12.9416, "lng": 80.2362},
    "Kelambakkam": {"lat": 12.7892, "lng": 80.2210},
    "Royapuram": {"lat": 13.1157, "lng": 80.2931},
    "Washermanpet": {"lat": 13.1087, "lng": 80.2806},
}

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees)
    """
    # convert decimal degrees to radians
    r_lat1, r_lon1, r_lat2, r_lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # haversine formula
    dlon = r_lon2 - r_lon1
    dlat = r_lat2 - r_lat1
    a = math.sin(dlat / 2)**2 + math.cos(r_lat1) * math.cos(r_lat2) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371.0 # Radius of earth in kilometers
    return round(c * r, 2)
