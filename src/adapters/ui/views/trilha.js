// As trilhas da 1.0 viraram o catálogo de aulas por área.
import { areaV2 } from '../../../domain/areas.js';

export default async function trilha(el, ctx, { args: [id] }) {
  location.replace(`#/aulas?area=${areaV2(id)}`);
}
