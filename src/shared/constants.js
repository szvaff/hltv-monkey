import $ from 'jquery'

export const unixDate = new Date(parseInt($("div.date").attr("data-unix")));
export const team1 = $("div.teamName")[0].innerText;
export const team2 = $("div.teamName")[1].innerText;
export const URL_PREFIX_LINEUP_MATCHES = "https://www.hltv.org/stats/lineup/matches/";

export const LOCALSTORAGE_KEYS = {
  MONTH: 'hltv_monkey_month_selection',
  MIN_LINEUP_MATCH: 'hltv_monkey_min_lineup_match'
};

export const STYLES = {
  BIG_PADDING: {
      'padding': '5px 10px',
      'font-size': '10px'
  },
  LARGE_STRONG: {
      'font-size': '12px',
      'font-weight': 'bold'
  },
  STATS_ROW: {
      'padding': '5px 10px'
  },
  STATS_ROW_EVEN: {
      'background-color': '#f6f6f9'
  },
  STATS_ROW_STRONG: {
      'font-weight': 'bold'
  },
  STATS_ROW_VALUE: {
      'float': 'right'
  },
  MAP_CHANGER: {
      'width' : '100%',
      'font-size': '0',
      'background-color': '#fff',
      'margin-top': "10px",
      'padding-left': '13px'
  },
  MAP_CHANGER_ITEM: {
      'display': 'inline-block',
      'font-size': '12px',
      'text-align': 'center',
      'cursor': 'pointer'
  },
  ACTIVE_MAP_CHANGER_ITEM: {
      'font-weight': 'bold',
      'color': '#2d6da3;',
      'box-shadow': 'inset 0 -3px 0 0 #2d6da3'
  },
  INACTIVE_MAP_CHANGER_ITEM: {
      'font-weight': '',
      'color': '',
      'box-shadow': ''
  },
  RESULTS: {
      'margin-top': '25px'
  },
  RESULTS_RESULT_TD: {
      'text-align': 'center'
  },
  // NOTEPAD_WRAPPER: {
  //     'margin-top': '10px'
  // },
  NOTEPAD: {
      'width': '100%',
      'padding': '0'
  }
};

export const MAP_ID = {
    Cache: 29,
    Inferno: 33,
    Mirage: 32,
    Nuke: 34,
    Overpass: 40,
    Train: 35,
    Dust2: 31,
    Vertigo: 46
};

export const ALL_MAPS = ["Cache", "Inferno", "Mirage", "Nuke", "Overpass", "Train", "Dust2", "Vertigo"];

export const STATS_DIV = "<div style='display: inline-block; width: 45%;' class='col-6'><div id='progress' style='text-align: center;position: relative; margin: 25px 0;'><div id='linebg' style='width: 100%;height: 5px;background: #aaaaaa;'></div><div id='line' style='transition: width 1s;height: 5px;position: absolute;top: 0px;background-image: linear-gradient(to right, #0075c2 , #1aaf5d);width:0%;'></div><div id='percentage'>0%</div></div></div>";
export const URL_PREFIX_LINEUP_STATS = "https://www.hltv.org/stats/lineup/map/";