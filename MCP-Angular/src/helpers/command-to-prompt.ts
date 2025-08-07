import { Command } from '../app/shared/models/command-type';

/**
 * Method to convert a command to a prompt.
 * @param command commad to convert to a prompt
 * @returns the prompt corresponding to the command
 */
export function commandToPrompt(command: Command): string {
  switch (command) {
    case '1':
      return "Donne moi l'URL d'authentification pour accéder à mon compte Google.";
    case '2':
      return 'Donne moi les 10 mails les plus récents.';
    default:
      return 'Unknown command';
  }
}
