import Disease from '../models/Disease';

class DiseaseService {
  async getDiseases() {
    const diseases = [
      new Disease('Disease 1', ['Symptom 1', 'Symptom 2']),
      new Disease('Disease 2', ['Symptom 3', 'Symptom 4']),
    ];
    return diseases;
  }

 async diagnoseDisease(symptoms) {
    const diseases = await this.getDiseases();
    const matchingDiseases = diseases.filter((disease) => {
      return symptoms.some((symptom) => disease.symptoms.includes(symptom));
    });
    return matchingDiseases;
  }
}

export default DiseaseService;