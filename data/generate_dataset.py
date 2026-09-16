import pandas as pd
import numpy as np

def generate_water_dataset(num_samples=2000):
    np.random.seed(42)
    
    # Generate features
    ph = np.random.normal(7.0, 1.5, num_samples)
    hardness = np.random.normal(196, 32, num_samples)
    solids = np.random.normal(22019, 8768, num_samples)
    chloramines = np.random.normal(7.1, 1.5, num_samples)
    sulfate = np.random.normal(333, 41, num_samples)
    conductivity = np.random.normal(426, 80, num_samples)
    organic_carbon = np.random.normal(14.2, 3.3, num_samples)
    trihalomethanes = np.random.normal(66.3, 16, num_samples)
    turbidity = np.random.normal(3.9, 0.7, num_samples)
    temperature = np.random.normal(25.0, 3.0, num_samples)
    do = np.random.normal(6.5, 1.5, num_samples) # Dissolved Oxygen
    
    # Create potability based on some rules with noise
    # Safe rules: pH between 6.5 and 8.5, turbidity < 5, solids < 30000, DO > 4
    potability_prob = np.where(
        (ph >= 6.5) & (ph <= 8.5) & 
        (turbidity < 4.5) & 
        (solids < 25000) & 
        (do > 5.0) &
        (sulfate < 350),
        0.8, # High prob of being potable
        0.2  # Low prob of being potable
    )
    
    # Add random noise
    potability = np.random.binomial(1, potability_prob)
    
    df = pd.DataFrame({
        'pH': ph,
        'Hardness': hardness,
        'Solids': solids,
        'Chloramines': chloramines,
        'Sulfate': sulfate,
        'Conductivity': conductivity,
        'Organic_Carbon': organic_carbon,
        'Trihalomethanes': trihalomethanes,
        'Turbidity': turbidity,
        'Temperature': temperature,
        'Dissolved_Oxygen': do,
        'Potability': potability
    })
    
    # Add some natural missing values (randomly 2-5% per column)
    for col in df.columns[:-1]: # Not target
        mask = np.random.rand(num_samples) < np.random.uniform(0.02, 0.05)
        df.loc[mask, col] = np.nan
        
    df.to_csv('dataset.csv', index=False)
    print(f"Generated synthetic dataset with {len(df)} rows and {len(df.columns)} columns.")

if __name__ == '__main__':
    generate_water_dataset()
