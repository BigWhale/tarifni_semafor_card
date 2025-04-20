# Tarifni Semafor Card

Custom Lovelace card for Home Assistant to display electricity tariff block information from the Tarifni Semafor integration.

## Installation via HACS

1. Add this repository as a custom repository in HACS (Frontend).
2. Install "Tarifni Semafor Card".
3. Add to Lovelace:

```yaml
type: 'custom:tarifni-semafor-card'
entity: sensor.tarifni_semafor
```
