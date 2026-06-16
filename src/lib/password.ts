/**
 * Hash bcrypt constant (d'une valeur aléatoire jetée). Sert à exécuter une
 * comparaison bcrypt « à vide » lorsqu'un compte n'existe pas, afin que la
 * connexion et le pré-check prennent le même temps que le compte existe ou non.
 * Cela neutralise l'énumération de comptes par mesure de timing.
 *
 * Ce n'est PAS un secret : c'est le hash d'une chaîne aléatoire inutilisable.
 */
export const DUMMY_PASSWORD_HASH =
  "$2a$12$XsZk0B03rbMrOaccyjGf5OGTzE9ObtA7TK0RE/.JPO9WUJzlPlV.y";
