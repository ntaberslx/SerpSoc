import { Component, OnInit  } from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

class Stat {
  name: string;
  value: number;

  constructor(name: string, value: number) {
    this.name = name;
    this.value = value;
  }

  setValue (value: number) {
    this.value = value;
  }
}

class Player {
  stats;
  name: string;
  trashBin;

  constructor(n_stats: number, name: string) {
    this.stats = [];
    this.name = name;
    this.trashBin = [];

    for (let i = 0; i < n_stats; i++) {
      this.stats.push(new Stat('Stat ' + (i + 1), 0));
    }
  }

  public buildStats(n_stats: number) {
    if (this.stats && this.stats.length < n_stats) {
      if (this.trashBin.length > 0) {
        this.stats.push(this.trashBin.shift());
      } else {
        this.stats.push(new Stat('Stat ' + (this.stats.length + 1), 0));
      }
    } else if (this.stats && this.stats.length > n_stats) {
      this.trashBin.push(this.stats.pop());
    }
  }

  public clearStats() {
    this.trashBin.push(this.stats);
    this.stats = [];
  }

  public itemizeStats() {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].name = 'Stat ' + (i + 1);
    }
  }

  setName(name: string) {
    this.name = name;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'Serpentine Socialism TTRPG Stat Distributor';
  public n_players: number;
  public n_stats: number;
  public playerArray;
  public trashBin;
  public colorScheme = [
    '#7a6c5d', '#E6C79C', '#ddc9b4', '#bcac9b', '#c17c74'
  ];
  public statData = {};
  public barChartOptions = {
    scaleShowVerticalLines: false,
    responsive: true
  };
  public barChartData;
  public barChartLabels = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'
  ];
  public barChartType = 'bar';
  public barChartLegend = false;

  constructor(private modalService: NgbModal) {}
  showStatModal(content): void {
    let data = [];
    for (const player of this.playerArray) {
      for (const stat of player.stats){
        data.push(stat.value);
      }
    }
    data = data.sort(function(a, b) { return a - b; } );
    this.statData = this.getStatData(data);
    this.barChartData = this.getBarChartData(data);
    this.modalService.open(content, { centered: true });
  }

  getBarChartData(data) {
    const histogram = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const it of data) {
      histogram[it] ++;
    }
    return JSON.parse(JSON.stringify(histogram));
  }

  getStatData(data) {
    return {
      mean : Math.floor(this.getMean(data)),
      std : Math.round(this.getSD(data) * 100) / 100
    };
  }

  getMean(data) {
    return data.reduce(function (a, b) {
      return Number(a) + Number(b);
    }) / data.length;
  }

  // Standard deviation
  getSD(data) {
    const m = this.getMean(data);
    return Math.sqrt(data.reduce(function (sq, n) {
      return sq + Math.pow(n - m, 2);
    }, 0) / (data.length - 1));
  }

  setPlayers(n_players) {
    this.n_players = n_players;
    this.buildArray();
  }

  setStats(n_stats) {
    this.n_stats = n_stats;
    this.buildArray();
  }

  buildArray() {
    const diff = this.playerArray.length - this.n_players;

    for (const player of this.playerArray) {
      player.buildStats(this.n_stats);
    }

    for (const player of this.trashBin) {
      player.buildStats(this.n_stats);
    }

    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        this.trashBin.push(this.playerArray.pop());
      }
    } else if (diff < 0) {
      for (let i = 0; i > diff; i--) {
        if (this.trashBin.length > 0) {
          this.playerArray.push(this.trashBin.shift());
        } else {
          this.playerArray.push(new Player(this.n_stats, 'New Player ' + (this.playerArray.length + 1)));
        }
      }
    }
  }

  distribute() {
    let stats = [];
    for (const player of this.playerArray) {
      for (let i = 0; i < this.n_stats; i++) {
        stats.push(player.stats.pop());
      }
    }
    stats = stats.sort(function(a, b) { return a.value - b.value; } );

    let iterator = 1;
    let current = 0;
    let turns = 0;
    for (const stat of stats) {
      console.log(current + ' ' + stat.value);
      this.playerArray[current].stats.push(stat);

      current += iterator;

      if (current === this.playerArray.length) {
        iterator = -1;
        current += iterator;
        turns += 1;
        if (turns % 2 === 0) {
          current = 0;
          iterator = 1;
        }
      } else if (current === -1) {
        iterator = 1;
        current += iterator;
        turns += 1;
        if (turns % 2 === 0) {
          current = this.playerArray.length - 1;
          iterator = -1;
        }
      }
    }
  }

  randomizeStats() {
    for (const player of this.playerArray) {
      player.stats.sort(function(a, b) { return 0.5 - Math.random(); });
      player.itemizeStats();
    }
  }

  roll() {
    for (const player of this.playerArray) {
      for (let i = 0; i < this.n_stats; i++) {
        player.stats[i].setValue(this.FourDSixDropLowest());
      }
    }
  }

  FourDSixDropLowest(): number {
    let results = [];
    for (let i = 0; i < 4; i++) {
      results.push(this.getRngInteger(1, 6));
    }
    results = results.sort(function(a, b) { return a - b; } );
    results.shift();
    return results[0] + results[1] + results[2];
  }

  getColor(i) {
    return {
      'background-color': this.colorScheme[i % this.colorScheme.length]
    };
  }

  getRngInteger(min, max): number {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
  }

  ngOnInit(): void {
    this.playerArray = [];
    this.trashBin = [];
    this.n_players = 4;
    this.n_stats = 6;
    this.buildArray();
  }
}
