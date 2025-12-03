#!/bin/bash

# Script pour générer des PNG de haute qualité des diagrammes PlantUML
# Usage: ./generate-pngs.sh

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Génération des diagrammes PNG ===${NC}\n"

# Créer le dossier de sortie
OUTPUT_DIR="./png-output"
mkdir -p "$OUTPUT_DIR"

# URL du serveur PlantUML (option 1 - nécessite connexion internet)
PLANTUML_SERVER="http://www.plantuml.com/plantuml/png"

# Télécharger PlantUML JAR si nécessaire (option 2 - meilleure qualité)
PLANTUML_JAR="plantuml.jar"
if [ ! -f "$PLANTUML_JAR" ]; then
    echo -e "${BLUE}Téléchargement de PlantUML...${NC}"
    curl -L -o "$PLANTUML_JAR" https://github.com/plantuml/plantuml/releases/download/v1.2024.3/plantuml-1.2024.3.jar
    echo -e "${GREEN}✓ PlantUML téléchargé${NC}\n"
fi

# Compter le nombre de fichiers
TOTAL=$(ls -1 *.puml 2>/dev/null | wc -l)
CURRENT=0

# Générer les PNG pour chaque fichier .puml
for file in *.puml; do
    if [ -f "$file" ]; then
        CURRENT=$((CURRENT + 1))
        filename=$(basename "$file" .puml)
        
        echo -e "${BLUE}[$CURRENT/$TOTAL] Génération: ${NC}$filename.png"
        
        # Utiliser PlantUML JAR avec options de haute qualité
        # -DPLANTUML_LIMIT_SIZE=8192 : Augmente la taille max des diagrammes
        # -tpng : Format PNG
        # -o : Dossier de sortie
        java -DPLANTUML_LIMIT_SIZE=8192 -jar "$PLANTUML_JAR" -tpng "$file" -o "$OUTPUT_DIR"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Généré: $OUTPUT_DIR/$filename.png${NC}\n"
        else
            echo -e "${RED}✗ Erreur lors de la génération de $file${NC}\n"
        fi
    fi
done

echo -e "${GREEN}=== Terminé! ===${NC}"
echo -e "Les diagrammes PNG sont dans: ${BLUE}$OUTPUT_DIR${NC}"
