import { Golem, World } from "../../dojo/bindings";

export interface GolemWithVisuals extends Golem {
  image: string;
  animations: {
    run: string[];
    jump: string[];
  };
}

export interface MapWithVisuals extends World {
  image: string;
  theme: string;
  highScore: number;
}
